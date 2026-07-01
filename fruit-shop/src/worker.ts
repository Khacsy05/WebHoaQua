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
                            to: [to],
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
                } catch (emailError) {
                    console.error("❌ [Email Worker] Lỗi khi gọi API Resend gửi mail:", emailError);
                }
            }
        }
    });
}

startWorker().catch(console.error);