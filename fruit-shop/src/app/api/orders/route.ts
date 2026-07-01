import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ShopOrder from "@/models/ShopOrder";
import OrderItem from "@/models/OrderItem";
import Product from "@/models/Product";
import Promotion from "@/models/Promotion";
import Customer from "@/models/Customer";
import { verifyAuth } from "@/lib/auth";
import mongoose from "mongoose";
import { getKafkaProducer } from "@/lib/kafka";

// [GET] /api/orders - Lấy danh sách đơn hàng (Quản trị xem hết, Khách hàng chỉ xem đơn của họ)
export async function GET(request: Request) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER", "ROLE_CUSTOMER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }
    const decoded = authResult.user;

    try {
        await connectDB();

        let query = {};
        if (decoded!.role !== "ROLE_ADMIN") {
            query = { customer_id: decoded!.customerId };
        }

        const orders = await ShopOrder.find(query)
            .populate("customer_id")
            .sort({ createdAt: -1 });

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.find({ order_id: order._id }).populate("product_id");
            return {
                ...order.toObject(),
                items
            };
        }));

        return NextResponse.json({ success: true, orders: ordersWithItems });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

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

        const customer = await Customer.findById(customer_id);
        const mockOrderId = new mongoose.Types.ObjectId();
        const orderEvent = {
            event: "OrderPlaced",
            data: {
                orderId: mockOrderId.toString(),
                customer_id,
                items, // [{ product_id, quantity, addons }]
                promotion_id,
                customerEmail: customer?.email || "khacsy0@e.tlu.edu.vn",
                customerName: customer?.name || "Khách hàng",
                shippingAddress: address || customer?.address || "Tại cửa hàng",
                createdAt: new Date()
            }
        };

        const producer = await getKafkaProducer();
        await producer.send({
            topic: "fruit-orders-topic",
            messages: [
                {
                    key: mockOrderId.toString(), // Dùng mã đơn hàng làm key định danh nhóm
                    value: JSON.stringify(orderEvent)
                }
            ]
        });
        return NextResponse.json({
            success: true,
            message: "Đặt hàng thành công!",
            order_id: mockOrderId
        }, { status: 202 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}