import jwt from "jsonwebtoken";

export interface DecodedToken {
    userId: string;
    username: string;
    role: "ROLE_ADMIN" | "ROLE_CUSTOMER";
    customerId?: string;
}

// Hàm giải mã và kiểm tra quyền từ Header của Request gửi lên
export function verifyAuth(request: Request, allowedRoles: string[]) {
    try {
        // Lấy chuỗi "Bearer <TOKEN>" từ Header có tên là Authorization
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return { success: false, status: 401, message: "Bạn chưa đăng nhập!" };
        }
        const token = authHeader.split(" ")[1];

        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

        // Kiểm tra xem quyền của user này có nằm trong danh sách được cho phép không
        if (!allowedRoles.includes(decoded.role)) {
            return { success: false, status: 403, message: "Bạn không có quyền truy cập tính năng này!" };
        }

        return { success: true, user: decoded };
    } catch (error) {
        return { success: false, status: 401, message: "Token không hợp lệ hoặc đã hết hạn!" };
    }
}