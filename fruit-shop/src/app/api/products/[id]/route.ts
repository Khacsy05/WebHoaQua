import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { verifyAuth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const product = await Product.findById(id).populate("category_id");
        if (!product) {
            return NextResponse.json({ success: false, message: "Sản phẩm không tồn tại" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }
    try {
        await connectDB();
        const { id } = await params;

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return NextResponse.json({ success: false, message: "Sản phẩm không tồn tại" }, { status: 404 });
        }

        const formData = await request.formData();
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const imageFile = formData.get("image");
        const price = formData.get("price") as string;
        const stock = formData.get("stock") as string;
        const category_id = formData.get("category_id") as string;

        if (!name || !price || !category_id) {
            return NextResponse.json({ success: false, message: "Thiếu thông tin sản phẩm bắt buộc" }, { status: 400 });
        }

        // Kiểm tra trùng tên với sản phẩm khác
        const duplicateProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            _id: { $ne: id }
        });

        if (duplicateProduct) {
            return NextResponse.json(
                { success: false, message: `Sản phẩm "${name}" đã tồn tại trong hệ thống rồi!` },
                { status: 400 }
            );
        }

        let imageUrl = existingProduct.image; // giữ lại ảnh cũ nếu không chọn ảnh mới

        if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
            const file = imageFile as File;
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uniqueName = `${Date.now()}-${file.name}`;

            const uploadDir = path.join(process.cwd(), "public", "images");
            const filePath = path.join(uploadDir, uniqueName);

            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(filePath, buffer);

            imageUrl = `/images/${uniqueName}`;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                description,
                image: imageUrl,
                price: Number(price),
                stock: stock ? Number(stock) : 0,
                category_id
            },
            { new: true }
        ).populate("category_id");

        return NextResponse.json({ success: true, data: updatedProduct });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }
    try {
        await connectDB();
        const { id } = await params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return NextResponse.json({ success: false, message: "Sản phẩm không tồn tại" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Xóa sản phẩm thành công!", data: product });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
