import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import ShopOrder from "@/models/ShopOrder";
import { verifyAuth } from "@/lib/auth";

// [GET] /api/customers - Lấy danh sách khách hàng và thống kê mua sắm (Chỉ Admin/Manager)
export async function GET(request: Request) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();

        // Lấy tất cả khách hàng
        const customers = await Customer.find().sort({ createdAt: -1 });

        // Nạp thống kê mua sắm song song cho từng khách hàng
        const customersWithStats = await Promise.all(customers.map(async (cust) => {
            const orders = await ShopOrder.find({ customer_id: cust._id });

            // Đếm tổng số đơn hàng đã đặt
            const totalOrders = orders.length;

            // Tính tổng số tiền đã mua (Không tính các đơn bị HỦY)
            const successfulOrders = orders.filter(o => o.status !== "CANCELLED");
            const totalSpent = successfulOrders.reduce((sum, o) => sum + o.payable_amount, 0);

            return {
                ...cust.toObject(),
                orderCount: totalOrders,
                totalSpent: totalSpent
            };
        }));

        return NextResponse.json({ success: true, customers: customersWithStats });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
