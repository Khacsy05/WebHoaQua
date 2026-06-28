import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ShopOrder from "@/models/ShopOrder";
import Product from "@/models/Product";
import Customer from "@/models/Customer";

export async function GET(request: Request) {
    const auth = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        await connectDB();

        // 1. Đếm sản phẩm
        const totalProducts = await Product.countDocuments();

        // 2. Đếm khách hàng
        const totalCustomers = await Customer.countDocuments();

        // 3. Đếm đơn hàng
        const totalOrders = await ShopOrder.countDocuments();

        // 4. Tính tổng doanh thu (payable_amount của các đơn hàng không bị hủy)
        const salesResult = await ShopOrder.aggregate([
            { $match: { status: { $ne: "CANCELLED" } } },
            { $group: { _id: null, totalSales: { $sum: "$payable_amount" } } }
        ]);
        const totalSales = salesResult[0]?.totalSales || 0;

        // 5. Lấy danh sách 5 đơn hàng gần đây nhất
        const recentOrders = await ShopOrder.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("customer_id", "name email phone");

        return NextResponse.json({
            success: true,
            data: {
                totalProducts,
                totalCustomers,
                totalOrders,
                totalSales,
                recentOrders
            }
        });
    } catch (error: any) {
        console.error("Lỗi khi lấy số liệu thống kê:", error);
        return NextResponse.json({ success: false, message: error.message || "Lỗi server" }, { status: 500 });
    }
}
