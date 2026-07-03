// src/lib/otpStore.ts

// Định nghĩa cấu trúc cho store: { "email@gmail.com": { code: "123456", expires: 171987... } }
interface OtpData {
    code: string;
    expires: number; // Lưu dạng Timestamp (mili giây) cho dễ so sánh
    used: boolean; // Thêm trường used để đánh dấu OTP đã được sử dụng hay chưa
}

type OtpStoreType = Record<string, OtpData>;

// Mẹo Singleton: Gán vào global để không bị reset khi Next.js Hot Reload khi bạn sửa code
const globalForOtp = globalThis as unknown as { otpStore: OtpStoreType };

export const otpStore = globalForOtp.otpStore || {};

if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = otpStore;