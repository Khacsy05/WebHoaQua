import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Promotion from "@/models/Promotion";

export async function GET() {
    try {
        await connectDB();
        const now = new Date();
        
        // Find active promotions that are currently valid
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
