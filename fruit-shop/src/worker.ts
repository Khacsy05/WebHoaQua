// src/worker.ts
import { connectDB } from "./lib/db";
import { kafka } from "./lib/kafka";
import ShopOrder from "./models/ShopOrder";
import OrderItem from "./models/OrderItem";
import Product from "./models/Product";
import Promotion from "./models/Promotion";
import DashboardStat from "./models/DashboardStat";
import Addon from "./models/Addon";
import Customer from "./models/Customer";
import UserAccount from "./models/UserAccount";
import { Resend } from "resend";

const consumer = kafka.consumer({ groupId: "fruit-shop-worker-group" });
// 🚨 THÊM PRODUCER: Để chuyển tiếp tin nhắn sang topic email
const producer = kafka.producer();
const resend = new Resend(process.env.RESEND_API_KEY);

async function startWorker() {
    // 1. Kết nối Database và Kafka
    await connectDB();

    // Tự động tạo topic nếu chưa có để tránh lỗi UNKNOWN_TOPIC_OR_PARTITION
    try {
        const admin = kafka.admin();
        await admin.connect();
        const existingTopics = await admin.listTopics();
        const targetTopics = ["fruit-orders-topic", "fruit-emails-topic"];
        const topicsToCreate = targetTopics.filter(t => !existingTopics.includes(t));
        if (topicsToCreate.length > 0) {
            await admin.createTopics({
                topics: topicsToCreate.map(t => ({ topic: t, numPartitions: 1 }))
            });
            console.log(`🚀 [Kafka Admin] Đã tự động tạo các topic: ${topicsToCreate.join(", ")}`);
        }
        await admin.disconnect();
    } catch (adminErr) {
        console.warn("⚠️ [Kafka Admin] Không thể tự động tạo topic, có thể Kafka tự tạo. Lỗi:", adminErr);
    }

    await consumer.connect();
    await producer.connect(); // 🚨 Kết nối thêm producer
    console.log("🤖 Worker chạy ngầm đã khởi động và đang đợi đơn hàng từ Kafka...");

    // 2. Đăng ký lắng nghe cả 2 topic
    await consumer.subscribe({
        topics: ["fruit-orders-topic", "fruit-emails-topic"],
        fromBeginning: false
    });
    console.log("🤖 Worker đã khởi động, đang canh gác Đơn Hàng và Email...");

    // 3. Vòng lặp liên tục lắng nghe tin nhắn mới
    await consumer.run({
        eachMessage: async ({ topic, message }) => { // 🚨 Thêm biến topic vào đây để phân biệt
            const rawValue = message.value?.toString();
            if (!rawValue) return;

            const payload = JSON.parse(rawValue);

            // =================================================================
            // LUỒNG 1: XỬ LÝ ĐƠN HÀNG (Từ fruit-orders-topic)
            // =================================================================
            if (topic === "fruit-orders-topic" && payload.event === "OrderPlaced") {
                const { data } = payload;
                console.log(`\n📥 [Kafka] Nhận được đơn hàng mới cần xử lý ngầm. ID tạm thời: ${data.orderId}`);

                try {
                    const { orderId, customer_id, items, promotion_id } = data;

                    let total_amount = 0;
                    const orderItemsData = [];

                    // Lặp qua danh sách item để kiểm tra và tính tiền gốc trong DB
                    for (const item of items) {
                        const product = await Product.findById(item.product_id);
                        if (!product || product.stock < item.quantity) {
                            console.log(`❌ Sản phẩm ${item.product_id} lỗi kho hoặc không tồn tại. Hủy xử lý đơn.`);
                            return;
                        }

                        // Tính thêm tiền của các dịch vụ đi kèm nếu có
                        let addonsTotal = 0;
                        if (item.addons) {
                            const addonNames = item.addons.split(',').map((name: string) => name.trim());
                            for (const addonName of addonNames) {
                                const addonObj = await Addon.findOne({
                                    name: { $regex: new RegExp(`^${addonName}$`, "i") }
                                });
                                if (addonObj) {
                                    addonsTotal += addonObj.price;
                                }
                            }
                        }

                        const finalUnitPrice = product.price + addonsTotal;
                        const itemTotal = finalUnitPrice * item.quantity;
                        total_amount += itemTotal;

                        orderItemsData.push({
                            product_id: product._id,
                            quantity: item.quantity,
                            unit_price: finalUnitPrice,
                            addons: item.addons || null
                        });

                        // Trừ bớt số lượng tồn kho của sản phẩm
                        product.stock -= item.quantity;
                        await product.save();
                        console.log(`   🔸 Đã cập nhật trừ kho cho sản phẩm: ${product.name} (Đơn giá gồm dịch vụ: ${finalUnitPrice}đ)`);

                        // Cảnh báo tồn kho thấp cho Admin
                        if (product.stock < 5) {
                            try {
                                // Truy vấn động danh sách tài khoản Admin từ DB
                                const admins = await UserAccount.findOne({ role: "ROLE_ADMIN", active: true });
                                const adminEmails = admins?.email;
                                const adminEmailPayload = {
                                    emailType: "ADMIN_STOCK_ALERT",
                                    to: adminEmails,
                                    subject: `⚠️ [CẢNH BÁO TỒN KHO] Sản phẩm ${product.name} sắp hết hàng!`,
                                    orderInfo: {
                                        productName: product.name,
                                        currentStock: product.stock
                                    }
                                };
                                await producer.send({
                                    topic: "fruit-emails-topic",
                                    messages: [{ value: JSON.stringify(adminEmailPayload) }]
                                });
                                console.log(`⚠️ [Kafka] Đẩy yêu cầu cảnh báo tồn kho cho sản phẩm ${product.name} (còn ${product.stock}) tới Admin: ${adminEmails}`);
                            } catch (err) {
                                console.error("❌ Lỗi khi gửi tin nhắn cảnh báo tồn kho lên Kafka:", err);
                            }
                        }
                    }

                    // Tính mã giảm giá
                    let discount_amount = 0;
                    if (promotion_id) {
                        const now = new Date();
                        const appliedPromotion = await Promotion.findById(promotion_id);

                        if (appliedPromotion && appliedPromotion.active &&
                            appliedPromotion.start_date <= now && appliedPromotion.end_date >= now &&
                            total_amount >= appliedPromotion.threshold_amount) {

                            discount_amount = Math.round((total_amount * appliedPromotion.discount_percent) / 100);
                        }
                    }

                    const payable_amount = total_amount - discount_amount;

                    // LƯU VÀO DATABASE THẬT
                    const newOrder = await ShopOrder.create({
                        _id: orderId,
                        customer_id,
                        status: "PENDING",
                        total_amount,
                        discount_amount,
                        payable_amount
                    });

                    const finalOrderItems = orderItemsData.map(item => ({
                        ...item,
                        order_id: newOrder._id
                    }));
                    await OrderItem.insertMany(finalOrderItems);

                    console.log(`✅ [Database] Đơn hàng #${orderId} đã được lưu vào MongoDB thành công!`);

                    // CẬP NHẬT DASHBOARD
                    const amount = payable_amount || 0;
                    await DashboardStat.updateOne(
                        { stat_id: "global_stat" },
                        {
                            $inc: {
                                totalOrders: 1,
                                totalSales: amount,
                            },
                        },
                        { upsert: true }
                    );
                    console.log(`📊 [Analytics] Đã cộng dồn +1 đơn và +${amount}đ vào Dashboard!`);

                    // Lấy thông tin khách hàng từ DB làm phương án dự phòng bảo mật
                    const dbCustomer = await Customer.findById(customer_id);

                    // 🚨 ĐẨY SỰ KIỆN GỬI EMAIL VÀO KAFKA (Hóa đơn gửi khách)
                    const emailPayload = {
                        emailType: "CUSTOMER_INVOICE",
                        to: data.customerEmail || dbCustomer?.email || "khacsy0@e.tlu.edu.vn", // Ưu tiên email khách từ API gửi qua, không thì lấy mail dự phòng của bạn
                        subject: `🛒 Hóa đơn đặt hàng thành công tại FruitShop #${orderId}`,
                        orderInfo: {
                            orderId,
                            customerName: data.customerName || dbCustomer?.name || "Khách hàng",
                            payable_amount: amount,
                            shippingAddress: data.shippingAddress || dbCustomer?.address || "Tại cửa hàng"
                        }
                    };

                    await producer.send({
                        topic: "fruit-emails-topic",
                        messages: [{ value: JSON.stringify(emailPayload) }]
                    });
                    console.log(`🚀 [Kafka] Đã đẩy yêu cầu gửi email sang fruit-emails-topic`);

                } catch (dbError) {
                    console.error("❌ Lỗi khi lưu đơn hàng vào DB:", dbError);
                }
            }

            if (payload.event === "OrderShipped") {
                console.log(`\n🚚 [Kafka] Đơn hàng đang được giao: #${payload.orderId}`);
            }

            // =================================================================
            // LUỒNG 2: XỬ LÝ GỬI EMAIL THẬT (Từ fruit-emails-topic)
            // =================================================================
            if (topic === "fruit-emails-topic") {
                try {
                    const { to, subject, orderInfo, emailType } = payload;
                    console.log(`\n📩 [Email Worker] Nhận lệnh gửi mail tới địa chỉ: ${to}`);

                    if (emailType === "CUSTOMER_INVOICE") {
                        await resend.emails.send({
                            from: "FruitShop <onboarding@resend.dev>", // Tên brand hiển thị test
                            to: to,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px;">
                                    <h2 style="color: #2e7d32; text-align: center;">Cám ơn bạn đã mua hàng! 🍎🥑</h2>
                                    <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                                    <p>Đơn hàng mã <strong>#${orderInfo.orderId}</strong> của bạn đã được hệ thống lưu trữ và đang chờ đóng gói.</p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <h4 style="margin-bottom: 5px;">Thông tin đơn hàng:</h4>
                                    <p style="margin: 5px 0;">💰 Tổng thanh toán: <strong style="color: #d32f2f;">${orderInfo.payable_amount.toLocaleString()}đ</strong></p>
                                    <p style="margin: 5px 0;">📍 Địa chỉ giao hàng: ${orderInfo.shippingAddress}</p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <p style="font-size: 11px; color: #888; text-align: center;">Thư thông báo tự động từ hệ thống luồng ngầm Kafka.</p>
                                </div>
                            `
                        });
                        console.log(`✅ [Email Worker] Đã gửi thư thành công tới ${to}!`);
                    }
                    if (emailType === "RESET_PASSWORD_OTP") {
                        await resend.emails.send({
                            from: "FruitShop <onboarding@resend.dev>",
                            to: to,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e0e0e0; max-width: 500px; border-radius: 12px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                    <h2 style="color: #1e88e5; text-align: center; margin-top: 0;">Khôi phục mật khẩu 🔑</h2>
                                    <p>Chào bạn,</p>
                                    <p>Chúng tôi nhận được yêu cầu lấy lại mật khẩu cho tài khoản liên kết với email này. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình:</p>
                                    
                                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d32f2f;">${orderInfo.otpCode}</span>
                                    </div>
                                    
                                    <p style="font-size: 13px; color: #757575; text-align: center;">⚠️ Mã này có hiệu lực trong vòng <strong>${orderInfo.expireIn}</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                    <p style="font-size: 11px; color: #999; text-align: center;">Nếu bạn không yêu cầu hành động này, bạn có thể an tâm bỏ qua email này.</p>
                                </div>
                            `
                        });
                        console.log(`✅ [Email Worker] Đã gửi mã OTP bảo mật tới thành công ${to}!`);
                    }
                    if (emailType === "ORDER_SHIPPING") {
                        await resend.emails.send({
                            from: "FruitShop <onboarding@resend.dev>",
                            to: to,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px;">
                                    <h2 style="color: #0288d1; text-align: center;">Đơn hàng của bạn đang được giao! 🚚✨</h2>
                                    <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                                    <p>Đơn hàng mã <strong>#${orderInfo.orderId}</strong> của bạn đã được bàn giao cho đơn vị vận chuyển và đang trên đường tới địa chỉ của bạn.</p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <h4 style="margin-bottom: 5px;">Thông tin giao hàng:</h4>
                                    <p style="margin: 5px 0;">📍 Địa chỉ nhận hàng: ${orderInfo.shippingAddress}</p>
                                    <p style="margin: 5px 0;">💰 Tổng thanh toán khi nhận hàng: <strong style="color: #d32f2f;">${orderInfo.payable_amount.toLocaleString()}đ</strong></p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <p style="font-size: 11px; color: #888; text-align: center;">Chúc bạn có trải nghiệm tuyệt vời với sản phẩm của FruitShop!</p>
                                </div>
                            `
                        });
                        console.log(`✅ [Email Worker] Đã gửi thư SHIPPING thành công tới ${to}!`);
                    }

                    if (emailType === "ORDER_CANCELLED") {
                        await resend.emails.send({
                            from: "FruitShop <onboarding@resend.dev>",
                            to: to,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px;">
                                    <h2 style="color: #c62828; text-align: center;">Đơn hàng đã bị hủy 🚫</h2>
                                    <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                                    <p>Chúng tôi rất tiếc phải thông báo rằng đơn hàng mã <strong>#${orderInfo.orderId}</strong> của bạn đã bị hủy bỏ trên hệ thống.</p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <h4 style="margin-bottom: 5px;">Thông tin chi tiết:</h4>
                                    <p style="margin: 5px 0;">💰 Giá trị đơn hàng: <strong>${orderInfo.payable_amount.toLocaleString()}đ</strong></p>
                                    <p style="margin: 5px 0;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline CSKH của FruitShop để được hỗ trợ.</p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <p style="font-size: 11px; color: #888; text-align: center;">Thư thông báo tự động từ hệ thống.</p>
                                </div>
                            `
                        });
                        console.log(`✅ [Email Worker] Đã gửi thư CANCELLED thành công tới ${to}!`);
                    }

                    if (emailType === "ORDER_DELIVERED") {
                        await resend.emails.send({
                            from: "FruitShop <onboarding@resend.dev>",
                            to: to,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px;">
                                    <h2 style="color: #2e7d32; text-align: center;">Đơn hàng giao thành công! 🎉🥳</h2>
                                    <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                                    <p>Đơn hàng mã <strong>#${orderInfo.orderId}</strong> của bạn đã được giao thành công đến bạn.</p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <h4 style="margin-bottom: 5px;">Thông tin đơn hàng:</h4>
                                    <p style="margin: 5px 0;">📍 Địa chỉ nhận hàng: ${orderInfo.shippingAddress}</p>
                                    <p style="margin: 5px 0;">💰 Tổng số tiền đã thanh toán: <strong style="color: #2e7d32;">${orderInfo.payable_amount.toLocaleString()}đ</strong></p>
                                    <hr style="border: none; border-top: 1px solid #eee;" />
                                    <p style="font-size: 11px; color: #888; text-align: center;">Cám ơn bạn đã lựa chọn FruitShop. Rất mong được phục vụ bạn trong những lần mua sắm tiếp theo!</p>
                                </div>
                            `
                        });
                        console.log(`✅ [Email Worker] Đã gửi thư DELIVERED thành công tới ${to}!`);
                    }

                    if (emailType === "ADMIN_STOCK_ALERT") {
                        const { data, error } = await resend.emails.send({
                            from: "FruitShop <onboarding@resend.dev>",
                            to: to,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ffccd5; max-width: 600px; border-radius: 8px; background-color: #fff5f5;">
                                    <h2 style="color: #c62828; text-align: center; margin-top: 0;">⚠️ CẢNH BÁO TỒN KHO THẤP ⚠️</h2>
                                    <p>Xin chào <strong>Admin</strong>,</p>
                                    <p>Hệ thống ghi nhận sản phẩm <strong>${orderInfo.productName}</strong> đang có số lượng tồn kho giảm xuống dưới mức tối thiểu (&lt; 5).</p>
                                    <hr style="border: none; border-top: 1px solid #ffccd5;" />
                                    <h4 style="margin-bottom: 5px; margin-top: 10px;">Thông tin sản phẩm:</h4>
                                    <p style="margin: 5px 0;">📦 Sản phẩm: <strong>${orderInfo.productName}</strong></p>
                                    <p style="margin: 5px 0;">🚨 Số lượng tồn kho hiện tại: <strong style="color: #c62828; font-size: 16px;">${orderInfo.currentStock}</strong></p>
                                    <hr style="border: none; border-top: 1px solid #ffccd5;" />
                                    <p style="font-size: 11px; color: #888; text-align: center;">Thư cảnh báo tự động từ hệ thống quản lý kho FruitShop.</p>
                                </div>
                            `
                        });

                        if (error) {
                            console.error("❌ [Email Worker] Resend API trả về lỗi:", error);
                        } else {
                            console.log(`✅ [Email Worker] Đã gửi thư CẢNH BÁO TỒN KHO thành công tới Admin: khacsy0@gmail.com!`);
                        }
                    }
                } catch (emailError) {
                    console.error("❌ [Email Worker] Lỗi khi gọi API Resend gửi mail:", emailError);
                }
            }
        }
    });
}

startWorker().catch(console.error);