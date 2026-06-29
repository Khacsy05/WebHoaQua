import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { verifyAuth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const filter = categoryId ? { category_id: categoryId } : {};

        const products = await Product.find(filter)
            .populate("category_id", "name")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: products });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


export async function POST(request: Request) {
    const auth = verifyAuth(request, ["ROLE_ADMIN"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }
    try {
        await connectDB();
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const imageFile = formData.get("image") as File;
        const price = formData.get("price") as string;
        const stock = formData.get("stock") as string;
        const category_id = formData.get("category_id") as string;

        if (!name || !price || !category_id) {
            return NextResponse.json({ success: false, message: "Thiếu thông tin sản phẩm bắt buộc" }, { status: 400 });
        }

        const existingProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });

        if (existingProduct) {
            return NextResponse.json(
                { success: false, message: `Sản phẩm "${name}" đã tồn tại trong hệ thống rồi!` },
                { status: 400 }
            );
        }
        let imageUrl = "";

        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uniqueName = `${Date.now()}-${imageFile.name}`;

            // Đường dẫn lưu file vào thư mục public/uploads để client truy cập trực tiếp được
            const uploadDir = path.join(process.cwd(), "public", "images");
            const filePath = path.join(uploadDir, uniqueName);

            // Tự động tạo thư mục public/uploads nếu chưa tồn tại
            await fs.mkdir(uploadDir, { recursive: true });

            // Ghi file vào ổ đĩa
            await fs.writeFile(filePath, buffer);

            // Đường dẫn URL lưu vào DB (ví dụ: /uploads/171819123-anh.jpg)
            imageUrl = `/images/${uniqueName}`;
        }

        const newProduct = await Product.create({
            name,
            description,
            image: imageUrl,
            price,
            stock,
            category_id
        });

        return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}