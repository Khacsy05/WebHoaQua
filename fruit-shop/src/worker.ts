// src/worker.ts
import { connectDB } from "./lib/db";
import { kafka } from "./lib/kafka";
import ShopOrder from "./models/ShopOrder";
import OrderItem from "./models/OrderItem";
import Product from "./models/Product";
import Promotion from "./models/Promotion";


const consumer = kafka.consumer({ groupId: "fruit-shop-worker-group" });

async function startWorker() {
    // 1. Kết nối Database và Kafka
    await connectDB();
    await consumer.connect();
    console.log("🤖 Worker chạy ngầm đã khởi động và đang đợi đơn hàng từ Kafka...");

    // 2. Đăng ký lắng nghe topic đơn hàng
    await consumer.subscribe({ topic: "fruit-orders-topic", fromBeginning: true });

    // 3. Vòng lặp liên tục lắng nghe tin nhắn mới
    await consumer.run({
        eachMessage: async ({ message }) => {
            const rawValue = message.value?.toString();
            if (!rawValue) return;

            const { event, data } = JSON.parse(rawValue);

            if (event === "OrderPlaced") {
                console.log(`\n📥 [Kafka] Nhận được đơn hàng mới cần xử lý ngầm. ID tạm thời: ${data.orderId}`);

                try {
                    const { orderId, customer_id, items, promotion_id } = data;

                    let total_amount = 0;
                    const orderItemsData = [];

                    // --- BẮT ĐẦU LOGIC XỬ LÝ NẶNG CỦA BẠN ---

                    // Lặp qua danh sách item để kiểm tra và tính tiền gốc trong DB
                    for (const item of items) {
                        const product = await Product.findById(item.product_id);
                        if (!product || product.stock < item.quantity) {
                            console.log(`❌ Sản phẩm ${item.product_id} lỗi kho hoặc không tồn tại. Hủy xử lý đơn.`);
                            return; // Trong thực tế chỗ này sẽ bắn sang một topic lỗi để xử lý riêng
                        }

                        const itemTotal = product.price * item.quantity;
                        total_amount += itemTotal;

                        orderItemsData.push({
                            product_id: product._id,
                            quantity: item.quantity,
                            unit_price: product.price,
                            addons: item.addons || null
                        });

                        // Trừ bớt số lượng tồn kho của sản phẩm
                        product.stock -= item.quantity;
                        await product.save();
                        console.log(`   🔸 Đã cập nhật trừ kho cho sản phẩm: ${product.name}`);
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

                    // LƯU VÀO DATABASE THẬT (Dùng đúng ID do Next.js sinh ra)
                    const newOrder = await ShopOrder.create({
                        _id: orderId, // Ghi đè bằng ID đồng bộ từ Next.js gửi qua
                        customer_id,
                        status: "NEW",
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
                    // ----------------------------------------

                } catch (dbError) {
                    console.error("❌ Lỗi khi lưu đơn hàng vào DB:", dbError);
                }
            }
        }
    });
}

startWorker().catch(console.error);