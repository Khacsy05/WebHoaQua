import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Promotion from "@/models/Promotion";
import { verifyAuth } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyAuth(request, ["ROLE_ADMIN", "ROLE_MANAGER"]);
    if (!authResult.success) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: authResult.status });
    }

    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        const { name, type, start_date, end_date, discount_percent, threshold_amount, active } = body;

        if (!name || !type || !start_date || !end_date || discount_percent === undefined) {
            return NextResponse.json({ success: false, message: "Thông tin khuyến mãi không đầy đủ" }, { status: 400 });
        }

        const updatedPromotion = await Promotion.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                type,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                discount_percent,
                threshold_amount: threshold_amount || 0,
                active: active !== undefined ? active : true
            },
            { new: true }
        );

        if (!updatedPromotion) {
            return NextResponse.json({ success: false, message: "Không tìm thấy chương trình khuyến mãi" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedPromotion });
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

        const deleted = await Promotion.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: "Không tìm thấy chương trình khuyến mãi" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Xóa khuyến mãi thành công!" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
