'use client';

import { useState } from 'react';
import { registerUser } from '@/services/authService';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('Mật khẩu nhập lại không khớp!');
            return;
        }

        setLoading(true);

        const res = await registerUser({
            email,
            username,
            password
        });

        if (res.success) {
            setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng sang Đăng nhập...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            setErrorMsg(res.message || 'Đã có lỗi xảy ra trong quá trình đăng ký.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 transition duration-300 hover:shadow-2xl">
                <div className="mb-6 text-center">
                    <div className="text-3xl font-extrabold text-green-600 tracking-tight mb-2">Đăng ký FruitShop</div>
                    <p className="text-gray-500 text-sm">Điền thông tin để trở thành khách hàng và nhận ưu đãi từ cửa hàng.</p>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email</label>
                        <input
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="example@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tên đăng nhập</label>
                        <input
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Nhập tài khoản"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
                        <input
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nhập lại mật khẩu</label>
                        <input
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Nhập lại mật khẩu"
                        />
                    </div>

                    <button
                        className="w-full py-3.5 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl tracking-wider text-sm transition active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed uppercase shadow-md shadow-green-100"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Đang đăng ký...' : 'Gửi đăng ký'}
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-500 text-sm">
                    Đã có tài khoản?{' '}
                    <a className="text-green-600 font-semibold hover:underline" href="/login">
                        Đăng nhập ngay
                    </a>
                    .
                </div>
            </div>
        </div>
    );
}
