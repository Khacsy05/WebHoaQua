'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loadUser, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await loadUser();
            if (!currentUser || (currentUser.role !== 'ROLE_ADMIN' && currentUser.role !== 'ROLE_MANAGER')) {
                alert('Bạn không có quyền truy cập kênh quản trị!');
                router.push('/shop');
            } else {
                setAuthorized(true);
            }
        };
        checkAuth();
    }, [router]);

    // Tự động đóng sidebar trên mobile khi chuyển trang
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        { name: 'Tổng quan', path: '/admin/dashboard' },
        { name: 'Danh mục', path: '/admin/categories' },
        { name: 'Sản phẩm', path: '/admin/products' },
        { name: 'Đơn hàng', path: '/admin/orders' },
        { name: 'Khách hàng', path: '/admin/customers' },
        { name: 'Khuyến mãi', path: '/admin/promotions' },
        { name: 'Dịch vụ thêm', path: '/admin/addons' },
    ];

    return (
        <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans relative">
            {/* BACKDROP OVERLAY ON MOBILE */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col justify-between h-screen z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:sticky top-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div>
                    {/* Brand */}
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">FruitShop</h1>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Kênh quản trị</span>
                            </div>
                        </div>
                        {/* Close button on mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-lg hover:bg-gray-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="p-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path || (item.path !== '/admin/dashboard' && pathname?.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                                            ? 'bg-green-600 text-white shadow-md shadow-green-600/10'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer section inside Sidebar */}
                <div className="p-4 border-t border-gray-50 space-y-3">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-black/10">
                            {user?.customer?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {user?.customer?.name || user?.name || 'Administrator'}
                            </p>
                            <p className="text-xs text-gray-400 font-medium truncate capitalize">
                                {user?.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Quản lý'}
                            </p>
                        </div>
                    </div>

                    {/* Back to Shop & Logout buttons */}
                    <div className="space-y-1">
                        <Link
                            href="/shop"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                        >
                            Quay lại Cửa hàng
                        </Link>
                        <button
                            onClick={() => {
                                logout();
                                router.push('/login');
                            }}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition focus:outline-none"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header of Content Area */}
                <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Button on mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none p-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">
                            {menuItems.find((item) => pathname === item.path || (item.path !== '/admin/dashboard' && pathname?.startsWith(item.path)))?.name || 'Tổng quan'}
                        </h2>
                    </div>
                    <div className="text-sm text-gray-400 font-medium hidden sm:block">
                        Ngày làm việc: {new Date().toLocaleDateString('vi-VN')}
                    </div>
                </header>

                {/* Main Content Body */}
                <div className="flex-1 p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
