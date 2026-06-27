import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ShopOrder from "@/models/ShopOrder";
import OrderItem from "@/models/OrderItem";
import Product from "@/models/Product";
import Promotion from "@/models/Promotion";
import Customer from "@/models/Customer";

// [POST] /api/orders - Tiến hành đặt hàng
export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        // items truyền lên dạng mảng: [{ product_id: "...", quantity: 2, addons: "..." }]
        const { customer_id, items, promotion_id, address, phone } = body;

        if (!customer_id || !items || items.length === 0) {
            return NextResponse.json({ success: false, message: "Thông tin giỏ hàng không hợp lệ" }, { status: 400 });
        }

        // Cập nhật thông tin địa chỉ & số điện thoại nếu khách hàng có thay đổi lúc thanh toán
        if (address || phone) {
            await Customer.findByIdAndUpdate(customer_id, {
                ...(address ? { address } : {}),
                ...(phone ? { phone } : {})
            });
        }

        let total_amount = 0;
        const orderItemsData = [];
        
        // Lặp qua danh sách item gửi lên để tính tiền dựa trên giá trị gốc trong database (Tránh client sửa giá)
        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (!product) {
                return NextResponse.json({ success: false, message: `Sản phẩm với ID ${item.product_id} không tồn tại` }, { status: 404 });
            }

            if (product.stock < item.quantity) {
                return NextResponse.json({ success: false, message: `Sản phẩm ${product.name} đã hết hàng hoặc không đủ số lượng` }, { status: 400 });
            }

            const itemTotal = product.price * item.quantity;
            total_amount += itemTotal;

            // Lưu lại thông tin tí nữa chèn vào bảng chi tiết
            orderItemsData.push({
                product_id: product._id,
                quantity: item.quantity,
                unit_price: product.price, // Chốt giá tại thời điểm mua
                addons: item.addons || null
            });

            // Trừ bớt số lượng tồn kho của sản phẩm
            product.stock -= item.quantity;
            await product.save();
        }
        let discount_amount = 0;
        let appliedPromotion = null;
        if (promotion_id) {
            const now = new Date();
            
            // Tìm chính xác cái mã mà khách chọn trong Database
            appliedPromotion = await Promotion.findById(promotion_id);

            // 🛡️ Kiểm tra tính hợp lệ của mã
            if (!appliedPromotion || !appliedPromotion.active) {
                return NextResponse.json({ success: false, message: "Mã khuyến mãi này không tồn tại hoặc đã bị khóa!" }, { status: 400 });
            }

            if (appliedPromotion.start_date > now || appliedPromotion.end_date < now) {
                return NextResponse.json({ success: false, message: "Mã khuyến mãi này đã hết hạn sử dụng!" }, { status: 400 });
            }

            // 🚨 Kiểm tra xem đơn hàng đã đạt giá trị tối thiểu (ngưỡng) để dùng mã này chưa
            if (total_amount < appliedPromotion.threshold_amount) {
                return NextResponse.json({ 
                success: false, 
                message: `Đơn hàng chưa đạt mức tối thiểu. Bạn cần mua thêm để đạt ${appliedPromotion.threshold_amount.toLocaleString('vi-VN')}đ để áp dụng mã này!` 
                }, { status: 400 });
            }

            // Nếu vượt qua hết các chốt chặn $\rightarrow$ Tính số tiền giảm
            discount_amount = Math.round((total_amount * appliedPromotion.discount_percent) / 100);
        }

        const payable_amount = total_amount - discount_amount;

        // 1. Tạo đơn hàng tổng (ShopOrder)
        const newOrder = await ShopOrder.create({
            customer_id,
            status: "NEW",
            total_amount,
            discount_amount,
            payable_amount
        });

        // 2. Thêm order_id vào các chi tiết đơn hàng rồi chèn hàng loạt (OrderItem)
        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            order_id: newOrder._id
        }));
        await OrderItem.insertMany(finalOrderItems);

        return NextResponse.json({
            success: true,
            message: "Đặt hàng thành công!",
            order_id: newOrder._id,
            payable_amount
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}