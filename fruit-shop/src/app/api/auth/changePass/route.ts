import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserAccount from "@/models/UserAccount";
import { verifyAuth } from "@/lib/auth";
import bcrypt from "bcrypt";
export async function POST(req: Request) {
    try {
        await connectDB();
        const authResult = verifyAuth(req, ["ROLE_ADMIN", "ROLE_CUSTOMER"]!);
        if (!authResult.success) {
            return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
        }
        const userId = authResult.user?.userId;
        const { oldPassword, newPassword } = await req.json();
        if (!oldPassword || !newPassword) {
            return NextResponse.json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' }, { status: 400 });
        }
        const user = await UserAccount.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng' }, { status: 404 });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, message: 'Sai mật khẩu cũ' }, { status: 401 });
        }
        user.password = newPassword;
        await user.save();
        return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });

    } catch (error) {

    }

}