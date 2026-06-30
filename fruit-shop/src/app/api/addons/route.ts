import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Addon from "@/models/Addon";
import { verifyAuth } from "@/lib/auth";

// [GET] /api/addons - Lấy toàn bộ dịch vụ thêm
export async function GET() {
    try {
        await connectDB();
        const addons = await Addon.find().populate("allowed_categories").sort({ price: 1 });
        return NextResponse.json({ success: true, data: addons });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// [POST] /api/addons - Thêm dịch vụ thêm mới
export async function POST(request: Request) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const body = await request.json();
        const { name, price, description, active, allowed_categories } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: "Tên dịch vụ không được để trống" }, { status: 400 });
        }
        if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
            return NextResponse.json({ success: false, message: "Giá dịch vụ phải là số lớn hơn hoặc bằng 0" }, { status: 400 });
        }

        const existingAddon = await Addon.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });

        if (existingAddon) {
            return NextResponse.json(
                { success: false, message: `Dịch vụ "${name}" đã tồn tại rồi!` },
                { status: 400 }
            );
        }

        const newAddon = await Addon.create({
            name: name.trim(),
            price: Number(price),
            description,
            active: active !== undefined ? active : true,
            allowed_categories: Array.isArray(allowed_categories) ? allowed_categories : []
        });

        const populatedAddon = await Addon.findById(newAddon._id).populate("allowed_categories");

        return NextResponse.json({ success: true, data: populatedAddon }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
