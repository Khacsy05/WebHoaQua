import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Promotion from "@/models/Promotion";
import { verifyAuth } from "@/lib/auth";

// [GET] /api/promotions - Lấy danh sách khuyến mãi
export async function GET(request: Request) {
    try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const all = searchParams.get("all") === "true";

        // Nếu yêu cầu lấy toàn bộ khuyến mãi (kênh quản trị)
        if (all) {
            const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
            if (!authResult.success) {
                return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
            }
            const promotions = await Promotion.find().sort({ createdAt: -1 });
            return NextResponse.json({ success: true, data: promotions });
        }

        // Mặc định đối với khách hàng: Chỉ lấy khuyến mãi đang hoạt động và còn thời hạn
        const now = new Date();
        const promotions = await Promotion.find({
            active: true,
            start_date: { $lte: now },
            end_date: { $gte: now }
        }).sort({ discount_percent: -1 });

        return NextResponse.json({ success: true, data: promotions });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// [POST] /api/promotions - Thêm khuyến mãi mới
export async function POST(request: Request) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const body = await request.json();
        const { name, type, start_date, end_date, discount_percent, threshold_amount, active } = body;

        if (!name || !type || !start_date || !end_date || discount_percent === undefined) {
            return NextResponse.json({ success: false, message: "Thông tin khuyến mãi không đầy đủ" }, { status: 400 });
        }

        const newPromotion = await Promotion.create({
            name: name.trim(),
            type,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            discount_percent,
            threshold_amount: threshold_amount || 0,
            active: active !== undefined ? active : true
        });

        return NextResponse.json({ success: true, data: newPromotion }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
