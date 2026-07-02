'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
    const router = useRouter();
    const { loadUser, logout } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        logout();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);

        const res = await loginUser(username, password);
        if (res.success) {
            setSuccessMsg('Đăng nhập thành công!');
            // Tải thông tin chi tiết của user vào Zustand Store ngay lập tức
            await loadUser(true);
            setTimeout(() => {
                router.push('/shop');
            }, 1000);
        } else {
            setErrorMsg(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 transition duration-300 hover:shadow-2xl">
                <div className="mb-6 text-center">
                    <div className="text-3xl font-extrabold text-green-600 tracking-tight mb-2">FruitShop</div>
                    <p className="text-gray-500 text-sm">Đăng nhập để mua trái cây tươi, quản lý đơn hàng và nhận ưu đãi.</p>
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
                    <button
                        className="w-full py-3.5 mt-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl tracking-wider text-sm transition active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed uppercase shadow-md shadow-green-100"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-500 text-sm flex justify-center items-center gap-3">
                    <a className="text-green-600 font-semibold hover:underline" href="/forgot-password">
                        Quên mật khẩu?
                    </a>
                    <span className="text-gray-300">•</span>
                    <a className="text-green-600 font-semibold hover:underline" href="/register">
                        Đăng ký ngay
                    </a>
                </div>
            </div>
        </div>
    );
}
