import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
    const auth = verifyAuth(request, ["ROLE_ADMIN", "ROLE_CUSTOMER"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }
    return NextResponse.json({
        success: true,
        data: {
            name: auth.user?.username,
            role: auth.user?.role,
            customerId: auth.user?.customerId
        }
    });
}
