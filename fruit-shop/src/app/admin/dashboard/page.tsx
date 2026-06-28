'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/services/authService';
import { formatCurrency } from '@/utils/helpers';
import Link from 'next/link';

interface Order {
    _id: string;
    customer_id: {
        name: string;
        email: string;
        phone: string;
    };
    status: "NEW" | "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
    payable_amount: number;
    createdAt: string;
}

interface StatsData {
    totalProducts: number;
    totalCustomers: number;
    totalOrders: number;
    totalSales: number;
    recentOrders: Order[];
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats', {
                    headers: getAuthHeaders()
                });
                const res = await response.json();
                if (res.success) {
                    setStats(res.data);
                } else {
                    setError(res.message || 'Lỗi khi tải số liệu thống kê');
                }
            } catch (err: any) {
                setError(err.message || 'Lỗi kết nối mạng');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statusBadges = {
        NEW: 'bg-blue-50 text-blue-700 border-blue-100',
        PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
        SHIPPING: 'bg-orange-50 text-orange-700 border-orange-100',
        DELIVERED: 'bg-green-50 text-green-700 border-green-100',
        CANCELLED: 'bg-red-50 text-red-700 border-red-100'
    };

    const statusTexts = {
        NEW: 'Mới',
        PENDING: 'Chờ duyệt',
        SHIPPING: 'Đang giao',
        DELIVERED: 'Đã giao',
        CANCELLED: 'Đã hủy'
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Stats cards loader */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 p-6">
                            <div className="w-10 h-10 bg-gray-100 rounded-2xl mb-4"></div>
                            <div className="h-4 bg-gray-100 rounded w-24 mb-2"></div>
                            <div className="h-6 bg-gray-100 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Table loader */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 h-96">
                    <div className="h-6 bg-gray-100 rounded w-36 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-50 rounded-2xl w-full"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 font-semibold text-center">
                ⚠️ Có lỗi xảy ra: {error}
            </div>
        );
    }

    const statCards = [
        { name: 'Tổng doanh thu', value: formatCurrency(stats?.totalSales || 0), icon: '💰', desc: 'Không tính đơn hủy', color: 'from-emerald-400 to-teal-500' },
        { name: 'Tổng đơn hàng', value: stats?.totalOrders || 0, icon: '📦', desc: 'Đã phát sinh', color: 'from-blue-400 to-indigo-500' },
        { name: 'Tổng sản phẩm', value: stats?.totalProducts || 0, icon: '🍎', desc: 'Có trên hệ thống', color: 'from-amber-400 to-orange-500' },
        { name: 'Số khách hàng', value: stats?.totalCustomers || 0, icon: '👥', desc: 'Đăng ký thành viên', color: 'from-purple-400 to-pink-500' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Greeting */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Chúc bạn một ngày làm việc hiệu quả! ☀️</h3>
                    <p className="text-sm text-gray-500 font-medium">Theo dõi các chỉ số bán hàng và quản trị hoạt động cửa hàng FruitShop.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/products" className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-600/10 transition">
                        + Thêm Sản Phẩm
                    </Link>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center justify-between hover:shadow-md transition duration-300">
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{card.name}</span>
                            <span className="text-2xl font-extrabold text-gray-900 block">{card.value}</span>
                            <span className="text-[10px] font-semibold text-gray-400 block">{card.desc}</span>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white text-xl shadow-md`}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900">Đơn hàng mới gần đây</h3>
                    <Link href="/admin/orders" className="text-green-600 hover:text-green-700 text-sm font-bold transition">
                        Xem tất cả đơn hàng &rarr;
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Mã đơn</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4">Số điện thoại</th>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Tổng tiền</th>
                                <th className="px-6 py-4">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/30 transition text-sm">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-500 text-xs">
                                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {order.customer_id?.name || 'Khách vãng lai'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {order.customer_id?.phone || 'Chưa cung cấp'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 font-extrabold text-gray-900">
                                            {formatCurrency(order.payable_amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${statusBadges[order.status]}`}>
                                                {statusTexts[order.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                                        Chưa có đơn hàng nào được ghi nhận.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
