import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ShopOrder from "@/models/ShopOrder";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import DashboardStat from "@/models/DashboardStat";

export async function GET(request: Request) {
    const auth = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        await connectDB();

        // 1. Đếm sản phẩm & Khách hàng (Giữ nguyên hoặc tối ưu sau)
        const totalProducts = await Product.countDocuments();
        const totalCustomers = await Customer.countDocuments();

        // 🔥 TỐI ƯU BẰNG KAFKA: Đọc thẳng từ bảng thống kê tính sẵn
        const stats = await DashboardStat.findOne({ stat_id: "global_stat" });

        const totalOrders = stats?.totalOrders || 0;
        const totalSales = stats?.totalSales || 0;

        // 5. Lấy danh sách 5 đơn hàng gần đây nhất (Giữ nguyên vì có limit 5 rất nhẹ)
        const recentOrders = await ShopOrder.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("customer_id", "name email phone");

        return NextResponse.json({
            success: true,
            data: {
                totalProducts,
                totalCustomers,
                totalOrders, // Trả về con số có sẵn vèo phát xong
                totalSales,  // Trả về con số có sẵn vèo phát xong
                recentOrders
            }
        });
    } catch (error: any) {
        console.error("Lỗi khi lấy số liệu thống kê:", error);
        return NextResponse.json({ success: false, message: error.message || "Lỗi server" }, { status: 500 });
    }
}