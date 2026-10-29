import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { verifyAuth } from "@/lib/auth";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const limitParam = searchParams.get("limit");

        const filter: any = {};
        if (categoryId) {
            filter.category_id = categoryId;
        }
        if (search && search.trim()) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        let query = Product.find(filter)
            .populate("category_id", "name")
            .sort({ createdAt: -1 });

        if (limitParam) {
            const limit = parseInt(limitParam, 10);
            if (!isNaN(limit) && limit > 0) {
                query = query.limit(limit);
            }
        }

        const products = await query;

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

            const uploadResult = await new Promise<any>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'fruit-shop-products' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(buffer);
            });

            imageUrl = uploadResult.secure_url;
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