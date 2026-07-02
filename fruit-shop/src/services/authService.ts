import { User } from "@/types/shop";

export function getAuthHeaders(): HeadersInit {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("fruit_shop_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function fetchCurrentUser(): Promise<User | null> {
    try {
        const response = await fetch('/api/auth/me', {
            headers: getAuthHeaders()
        });
        if (!response.ok) return null;
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        return null;
    }
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; message?: string; token?: string; user?: any }> {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const res = await response.json();
        if (res.success && res.token) {
            localStorage.setItem("fruit_shop_token", res.token);
        }
        return res;
    } catch (error: any) {
        console.error("Lỗi khi đăng nhập:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

export interface RegisterPayload {
    email: string;
    username: string;
    password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi đăng ký:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

export function logoutUser() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("fruit_shop_token");
    }
}

export async function updateCurrentUser(payload: { name: string; phone: string; address: string }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi cập nhật thông tin người dùng:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

export async function sendOtpCode(email: string) {
    try {
        const response = await fetch("/api/auth/sendOtp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi gửi OTP:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}