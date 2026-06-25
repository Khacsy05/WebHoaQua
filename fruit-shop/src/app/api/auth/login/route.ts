import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserAccount from "@/models/UserAccount";
import jwt from "jsonwebtoken";
import Customer from "@/models/Customer";

export async function POST(request: Request) {
    try {
        await connectDB();
        const { username, password } = await request.json();

        // 1. Tìm user theo username
        const user = await UserAccount.findOne({ username });
        if (!user || !user.active) {
            return NextResponse.json({ success: false, message: "Tài khoản không tồn tại hoặc bị khóa" }, { status: 400 });
        }

        // 2. Sử dụng hàm comparePassword (bất đồng bộ) mà chúng mình đã viết ở Model
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json({ success: false, message: "Mật khẩu không chính xác" }, { status: 400 });
        }
        let customerInfo = null;
        if (user.role === "ROLE_CUSTOMER") {
            customerInfo = await Customer.findOne({ user_id: user._id });
        }

        // 3. Đăng nhập đúng -> Tạo mã JWT Token nén thông tin quyền hạn (role) vào
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username, 
                role: user.role,
                customerId: customerInfo ? customerInfo._id : null
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" } // Token có tác dụng trong 1 ngày
        );

        return NextResponse.json({
            success: true,
            message: "Đăng nhập thành công!",
            token, // Trả token về cho Frontend lưu lại (lưu vào localStorage hoặc Cookie)
            user: 
            { 
                username: user.username, 
                full_name: user.full_name, 
                role: user.role 
            }
            
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}