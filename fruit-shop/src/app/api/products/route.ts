import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const products = await Product.find()
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
        const body = await request.json();
        const { name, description, image, price, stock, category_id } = body;

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
        const newProduct = await Product.create({
            name,
            description,
            image,
            price,
            stock,
            category_id
        });

        return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}