import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { verifyAuth } from "@/lib/auth";
// [GET] /api/categories - Lấy toàn bộ danh mục
export async function GET() {
    try {
        await connectDB();
        const categories = await Category.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// [POST] /api/categories - Thêm danh mục mới
export async function POST(request: Request) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: "Tên danh mục không được để trống" }, { status: 400 });
        }

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });

        if (existingCategory) {
            return NextResponse.json(
                { success: false, message: `Danh mục "${name}" đã tồn tại rồi!` },
                { status: 400 }
            );
        }
        const newCategory = await Category.create({ 
            name: name.trim(), // Xóa khoảng trắng thừa 2 đầu cho đẹp dữ liệu
            description 
        });
        return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}