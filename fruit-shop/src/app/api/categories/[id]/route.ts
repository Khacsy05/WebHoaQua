import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { verifyAuth } from "@/lib/auth";

// [PUT] /api/categories/[id] - Cập nhật thông tin danh mục
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: "Tên danh mục không được để trống" }, { status: 400 });
        }

        const existingCategory = await Category.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });

        if (existingCategory) {
            return NextResponse.json(
                { success: false, message: `Danh mục với tên "${name}" đã tồn tại!` },
                { status: 400 }
            );
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: name.trim(), description },
            { new: true }
        );

        if (!updatedCategory) {
            return NextResponse.json({ success: false, message: "Không tìm thấy danh mục để cập nhật" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedCategory });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// [DELETE] /api/categories/[id] - Xóa danh mục
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const { id } = await params;

        // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
        const productCount = await Product.countDocuments({ category_id: id });
        if (productCount > 0) {
            return NextResponse.json({
                success: false,
                message: `Không thể xóa danh mục này vì hiện đang có ${productCount} sản phẩm trực thuộc!`
            }, { status: 400 });
        }

        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return NextResponse.json({ success: false, message: "Không tìm thấy danh mục để xóa" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Xóa danh mục thành công!" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
