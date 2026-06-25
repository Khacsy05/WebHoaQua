import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ShopOrder from "@/models/ShopOrder";
import { verifyAuth } from "@/lib/auth";

// 🔒 [PUT] /api/orders/[id] - Duyệt trạng thái đơn hàng (Chỉ ADMIN)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Chốt chặn phân quyền: Chỉ ADMIN mới được duyệt đơn
    const auth = verifyAuth(request, ["ROLE_ADMIN"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        await connectDB();
        const { id } = await params; // Lấy ID đơn hàng từ URL
        const body = await request.json();
        const { status } = body; 

        // 2. 🛡️ Đồng bộ chuẩn chỉnh mảng enum từ Model ShopOrder của bạn
        const validStatuses = ["NEW", "PENDING", "SHIPPING", "DELIVERED", "CANCELLED"];
        
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, message: `Trạng thái không hợp lệ! Chỉ được chọn: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // 3. Tìm đơn hàng
        const order = await ShopOrder.findById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, message: "Không tìm thấy đơn hàng này trên hệ thống!" },
                { status: 404 }
            );
        }

        // 4. Cập nhật và lưu lại
        order.status = status;
        await order.save();

        return NextResponse.json({
            success: true,
            message: `Cập nhật trạng thái đơn hàng sang [${status}] thành công!`,
            data: order
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}