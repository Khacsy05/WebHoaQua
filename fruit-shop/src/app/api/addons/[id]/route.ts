import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Addon from "@/models/Addon";
import { verifyAuth } from "@/lib/auth";

// [PUT] /api/addons/[id] - Cập nhật dịch vụ thêm
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        const { name, price, description, active } = body;

        const existingAddon = await Addon.findById(id);
        if (!existingAddon) {
            return NextResponse.json({ success: false, message: "Dịch vụ không tồn tại" }, { status: 404 });
        }

        if (!name) {
            return NextResponse.json({ success: false, message: "Tên dịch vụ không được để trống" }, { status: 400 });
        }
        if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
            return NextResponse.json({ success: false, message: "Giá dịch vụ phải là số lớn hơn hoặc bằng 0" }, { status: 400 });
        }

        // Kiểm tra trùng tên với dịch vụ khác
        const duplicateAddon = await Addon.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            _id: { $ne: id }
        });

        if (duplicateAddon) {
            return NextResponse.json(
                { success: false, message: `Dịch vụ "${name}" đã tồn tại rồi!` },
                { status: 400 }
            );
        }

        const updatedAddon = await Addon.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                price: Number(price),
                description,
                active: active !== undefined ? active : true
            },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updatedAddon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// [DELETE] /api/addons/[id] - Xóa dịch vụ thêm
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const { id } = await params;
        
        const deletedAddon = await Addon.findByIdAndDelete(id);
        if (!deletedAddon) {
            return NextResponse.json({ success: false, message: "Dịch vụ không tồn tại" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Xóa dịch vụ thành công!", data: deletedAddon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
