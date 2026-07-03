import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserAccount from "@/models/UserAccount";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json({ success: false, message: "Missing token or password" }, { status: 400 });
        }

        // Xác thực token
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
        } catch (jwtError) {
            return NextResponse.json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        const user = await UserAccount.findOne({ email: decoded.email });
        if (!user) {
            return NextResponse.json({ success: false, message: "Không tìm thấy người dùng" }, { status: 404 });
        }

        // Cập nhật mật khẩu mới (Mongoose pre-save hook sẽ tự động brypt hash mật khẩu này)
        user.password = newPassword;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Đặt lại mật khẩu thành công!"
        });
    } catch (error: any) {
        console.error("Error occurred while resetting password:", error);
        return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
    }
}