import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ShopOrder from "@/models/ShopOrder";
import OrderItem from "@/models/OrderItem";
import { verifyAuth } from "@/lib/auth";

// [GET] /api/orders/[id] - Xem chi tiết đơn hàng (kèm sản phẩm)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const order = await ShopOrder.findById(id).populate("customer_id");
        if (!order) {
            return NextResponse.json({ success: false, message: "Không tìm thấy đơn hàng!" }, { status: 404 });
        }

        const items = await OrderItem.find({ order_id: id }).populate("product_id");

        return NextResponse.json({ success: true, order, items });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// 🔒 [PUT] /api/orders/[id] - Cập nhật trạng thái đơn hàng (ADMIN/MANAGER cập nhật bất kỳ, CUSTOMER/USER chỉ được hủy đơn của mình)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER", "ROLE_CUSTOMER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }
    const decoded = authResult.user!;

    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ["PENDING", "SHIPPING", "DELIVERED", "CANCELLED"];

        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, message: `Trạng thái không hợp lệ! Chỉ được chọn: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const order = await ShopOrder.findById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, message: "Không tìm thấy đơn hàng này trên hệ thống!" },
                { status: 404 }
            );
        }

        const isUserAdmin = decoded.role === "ROLE_ADMIN";

        if (!isUserAdmin) {
            // Khách hàng tự thao tác đơn hàng của mình
            if (String(order.customer_id) !== String(decoded.customerId)) {
                return NextResponse.json(
                    { success: false, message: "Bạn không có quyền thay đổi trạng thái của đơn hàng này!" },
                    { status: 403 }
                );
            }
            // Khách hàng chỉ được phép hủy đơn hàng
            if (status !== "CANCELLED") {
                return NextResponse.json(
                    { success: false, message: "Bạn chỉ được phép hủy đơn hàng của mình!" },
                    { status: 403 }
                );
            }
            // Chỉ được hủy khi đơn chưa giao
            if (order.status !== "PENDING") {
                return NextResponse.json(
                    { success: false, message: "Đơn hàng đã giao hoặc đang vận chuyển, không thể hủy đơn!" },
                    { status: 400 }
                );
            }
        }

        const currentStatus = order.status;
        if (status !== currentStatus) {
            if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
                return NextResponse.json(
                    { success: false, message: `Đơn hàng đã ở trạng thái cuối (${currentStatus === "DELIVERED" ? "Đã giao" : "Đã hủy"}), không thể thay đổi trạng thái nữa!` },
                    { status: 400 }
                );
            }

            if (currentStatus === "PENDING") {
                if (status !== "SHIPPING" && status !== "CANCELLED") {
                    return NextResponse.json(
                        { success: false, message: "Đơn hàng Chờ duyệt chỉ có thể chuyển sang Đang giao (SHIPPING) hoặc Đã hủy (CANCELLED)!" },
                        { status: 400 }
                    );
                }
            }

            if (currentStatus === "SHIPPING") {
                if (status !== "DELIVERED" && status !== "CANCELLED") {
                    return NextResponse.json(
                        { success: false, message: "Đơn hàng Đang giao chỉ có thể chuyển sang Đã giao (DELIVERED) hoặc Đã hủy (CANCELLED)!" },
                        { status: 400 }
                    );
                }
            }
        }

        order.status = status;
        await order.save();

        return NextResponse.json({
            success: true,
            message: status === "CANCELLED" && !isUserAdmin
                ? "Hủy đơn hàng của bạn thành công!"
                : `Cập nhật trạng thái đơn hàng sang [${status}] thành công!`,
            data: order
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}