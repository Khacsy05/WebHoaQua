import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { otpStore } from "@/lib/otpStore";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: "Vui lòng nhập đầy đủ Email và OTP" },
                { status: 400 }
            );
        }

        const record = otpStore[email];

        if (!record) {
            return NextResponse.json(
                { success: false, message: "Yêu cầu OTP không tồn tại hoặc đã bị xóa" },
                { status: 400 }
            );
        }

        if (record.used) {
            return NextResponse.json(
                { success: false, message: "Mã OTP này đã được sử dụng trước đó" },
                { status: 400 }
            );
        }

        if (Date.now() > record.expires) {
            return NextResponse.json(
                { success: false, message: "Mã OTP đã hết hiệu lực (quá 5 phút)" },
                { status: 400 }
            );
        }

        if (record.code !== otp.trim()) {
            return NextResponse.json(
                { success: false, message: "Mã OTP nhập vào không chính xác" },
                { status: 400 }
            );
        }

        // Đánh dấu mã OTP đã được sử dụng thành công
        record.used = true;

        // Ký JWT Token tạm thời có hiệu lực trong 15 phút chứa email đã được xác minh
        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET || "SECRET_KEY",
            { expiresIn: "15m" }
        );

        return NextResponse.json({
            success: true,
            message: "Xác thực OTP thành công!",
            token
        });
    } catch (error: any) {
        console.error("Lỗi khi xác thực OTP:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}