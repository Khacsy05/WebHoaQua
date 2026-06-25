import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserAccount from "@/models/UserAccount";
import Customer from "@/models/Customer";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, password, email } = body;

    // 1. Kiểm tra các trường dữ liệu bắt buộc đầu vào
    if (!username || !password || !email) {
        return NextResponse.json(
            { success: false, message: "Vui lòng điền đầy đủ: Tài khoản, Mật khẩu và Email" },
            { status: 400 }
        );
    }

    // Định dạng lại dữ liệu đầu vào (Xóa khoảng trắng, chuyển email về chữ thường để tránh lọt lưới)
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 2. 🛡️ CHẶN TRÙNG TÀI KHOẢN: Kiểm tra xem username đã tồn tại chưa
    const existingUser = await UserAccount.findOne({ username: cleanUsername });
    if (existingUser) {
        return NextResponse.json(
            { success: false, message: "Tài khoản (Username) này đã tồn tại!" },
            { status: 400 }
        );
    }

    // 3. 🛡️ CHẶN TRÙNG EMAIL: Kiểm tra xem email này đã được sử dụng chưa
    const existingEmail = await UserAccount.findOne({ email: cleanEmail });
    if (existingEmail) {
        return NextResponse.json(
            { success: false, message: "Email này đã được đăng ký bởi một tài khoản khác!" },
            { status: 400 }
        );
    }

    // 4. Tiến hành tạo tài khoản đăng nhập (UserAccount)
    const newUser = await UserAccount.create({
        username: cleanUsername,
        password: password, // Mật khẩu tự động băm nhờ Middleware của Mongoose
        email: cleanEmail,
        full_name: cleanUsername, // Tên hiển thị tạm thời trùng với Username
        role: "ROLE_CUSTOMER", // Mặc định đăng ký qua đây là Khách hàng
        active: true
    });

    // 5. 🌟 TỰ ĐỘNG TẠO BẢNG CUSTOMER TƯƠNG ỨNG
    // Đồng bộ email thật vừa đăng ký sang, các trường khác tạm thời để null
    await Customer.create({
        user_id: newUser._id, // Khóa ngoại kết nối sang UserAccount
        name: cleanUsername,  // Tên tạm thời trùng với Username
        email: cleanEmail,    // Lưu email sang bảng Customer để tiện liên lạc/gửi đơn hàng
        phone: null,
        address: null
    });

    return NextResponse.json({
        success: true,
        message: "Đăng ký tài khoản thành công!",
        data: {
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}