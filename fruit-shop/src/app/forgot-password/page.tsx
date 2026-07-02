'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtpCode } from '@/services/authService';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Luồng: Step 1 (Nhập Email & Nhập OTP) -> Step 2 (Reset mật khẩu & Confirm mật khẩu)
    const [step, setStep] = useState<1 | 2>(1);
    const [otpSent, setOtpSent] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Gửi mã OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        if (!email.trim()) {
            setErrorMsg('Vui lòng nhập địa chỉ email!');
            return;
        }

        setLoading(true);
        const res = await sendOtpCode(email);
        if (res.success) {
            setSuccessMsg(res.message || 'Mã OTP đã được gửi đến email của bạn.');
            setOtpSent(true);
        } else {
            setErrorMsg(res.error || res.message || 'Gửi OTP thất bại. Vui lòng kiểm tra lại email.');
        }
        setLoading(false);
    };

    // Xác nhận OTP thành công -> Chuyển sang trang đặt lại mật khẩu
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!otp.trim()) {
            setErrorMsg('Vui lòng nhập mã OTP!');
            return;
        }
        if (otp.length !== 6) {
            setErrorMsg('Mã OTP phải gồm 6 chữ số!');
            return;
        }

        setLoading(true);
        // Giả lập xác thực OTP (Do chưa có API verifyOtp, bất kỳ mã 6 số nào cũng được chấp nhận để test)
        setTimeout(() => {
            setSuccessMsg('Xác thực OTP thành công!');
            setLoading(false);
            setTimeout(() => {
                setSuccessMsg('');
                setStep(2); // Chuyển sang trang đặt lại mật khẩu mới
            }, 800);
        }, 800);
    };

    // Thực hiện đặt lại mật khẩu mới
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (newPassword.length < 6) {
            setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên!');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
            return;
        }

        setLoading(true);
        // Giả lập thay đổi mật khẩu thành công (Có thể nối với API update password sau này)
        setTimeout(() => {
            setSuccessMsg('Khôi phục mật khẩu thành công! Hãy đăng nhập lại bằng mật khẩu mới.');
            setLoading(false);
            setTimeout(() => {
                router.push('/login');
            }, 1800);
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 transition duration-300 hover:shadow-2xl">
                <div className="mb-6 text-center">
                    <div className="text-3xl font-extrabold text-green-600 tracking-tight mb-2">FruitShop</div>
                    <p className="text-gray-500 text-sm">
                        {step === 1 
                            ? 'Nhập email của bạn để nhận mã OTP xác thực khôi phục tài khoản.' 
                            : 'Thiết lập mật khẩu mới cho tài khoản FruitShop của bạn.'}
                    </p>
                </div>

                {successMsg && (
                    <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl text-center">
                        {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
                        {errorMsg}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-4">
                        {/* Form gửi OTP */}
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email tài khoản</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={otpSent}
                                        placeholder="example@gmail.com"
                                    />
                                    {!otpSent && (
                                        <button
                                            className="px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition active:scale-[0.99] uppercase shadow-md shadow-green-100 whitespace-nowrap"
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>

                        {/* Ô nhập OTP hiện ngay dưới email sau khi click gửi thành công */}
                        {otpSent && (
                            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2 border-t border-gray-100 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-center">Nhập mã OTP đã nhận</label>
                                    <input
                                        className="w-full p-3.5 border border-gray-300 rounded-xl text-lg bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none text-center font-bold tracking-[8px]"
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        placeholder="------"
                                    />
                                </div>
                                <button
                                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl tracking-wider text-sm transition active:scale-[0.99] disabled:bg-gray-300 uppercase shadow-md shadow-green-100"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xác thực...' : 'Xác thực mã OTP'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp('');
                                    }}
                                    className="w-full py-2 bg-white hover:bg-gray-50 text-gray-500 font-semibold rounded-xl border border-gray-200 transition text-xs"
                                >
                                    Nhập lại Email khác
                                </button>
                            </form>
                        )}
                    </div>
                ) : (
                    /* Step 2: Nhập mật khẩu mới & Xác nhận mật khẩu mới */
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
                            <input
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Nhập mật khẩu mới"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                            <input
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>
                        <button
                            className="w-full py-3.5 mt-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl tracking-wider text-sm transition active:scale-[0.99] disabled:bg-gray-300 uppercase shadow-md shadow-green-100"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu mật khẩu...' : 'Xác nhận khôi phục'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-gray-500 text-sm">
                    Quay lại{' '}
                    <a className="text-green-600 font-semibold hover:underline" href="/login">
                        Đăng nhập
                    </a>
                </div>
            </div>
        </div>
    );
}
