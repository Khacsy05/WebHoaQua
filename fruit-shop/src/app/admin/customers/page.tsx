'use client';

import { useState, useEffect } from 'react';
import { fetchCustomers } from '@/services/customerService';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

interface CustomerWithStats {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    orderCount: number;
    totalSpent: number;
    createdAt?: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [sortBy, setSortBy] = useState<'totalSpent' | 'orderCount' | 'name'>('totalSpent');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchCustomers();
            setCustomers(data);
            setCurrentPage(1);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách khách hàng');
            toast.error(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Xử lý Tìm kiếm
    const filteredCustomers = customers.filter(cust => {
        const query = searchQuery.toLowerCase();
        return (
            cust.name.toLowerCase().includes(query) ||
            cust.email.toLowerCase().includes(query) ||
            (cust.phone && cust.phone.includes(query))
        );
    });

    // Xử lý Sắp xếp
    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        let valA: any = a[sortBy] || 0;
        let valB: any = b[sortBy] || 0;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Thay đổi tiêu chí sắp xếp
    const handleSort = (field: 'totalSpent' | 'orderCount' | 'name') => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    if (loading && customers.length === 0) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100">
                    <div className="h-6 bg-gray-100 rounded w-48"></div>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 h-96">
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-50 rounded-2xl w-full"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header section */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Quản lý Khách hàng</h3>
                    <p className="text-sm text-gray-500 font-medium">Theo dõi danh sách khách hàng, thống kê số đơn đặt hàng và tổng chi tiêu tích lũy.</p>
                </div>

                {/* Search input */}
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, sđt..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-sm text-gray-800 transition pl-10"
                    />
                    <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">
                        🔍
                    </span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl border border-red-100 font-semibold text-center text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* List Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 w-20 text-center">STT</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition" onClick={() => handleSort('name')}>
                                    Khách hàng {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="px-6 py-4">Liên hệ</th>
                                <th className="px-6 py-4">Địa chỉ giao hàng mặc định</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition text-center w-32" onClick={() => handleSort('orderCount')}>
                                    Số Đơn đặt {sortBy === 'orderCount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition text-right w-44" onClick={() => handleSort('totalSpent')}>
                                    Tổng chi tiêu {sortBy === 'totalSpent' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sortedCustomers.length > 0 ? (
                                sortedCustomers
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((cust, index) => {
                                        const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                        const isVip = cust.totalSpent >= 2000000; // VIP nếu mua trên 2 triệu

                                        return (
                                            <tr key={cust._id} className="hover:bg-gray-50/30 transition text-sm">
                                                <td className="px-6 py-4 font-mono text-gray-400 text-xs text-center">
                                                    {displayIndex}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-gray-900">{cust.name}</div>
                                                        {isVip && (
                                                            <span className="px-2 py-0.5 text-[9px] font-black text-amber-600 bg-amber-50 rounded border border-amber-200 uppercase tracking-wide">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-700 text-xs">{cust.email}</div>
                                                    <div className="text-xs text-gray-400 font-bold mt-0.5">{cust.phone || 'Chưa cung cấp SĐT'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 font-semibold max-w-xs truncate" title={cust.address}>
                                                    {cust.address || 'Chưa thiết lập địa chỉ'}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-gray-700">
                                                    {cust.orderCount}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-green-600">
                                                    {formatCurrency(cust.totalSpent)}
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                                        Không tìm thấy khách hàng nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {sortedCustomers.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <span className="text-xs text-gray-400 font-medium">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedCustomers.length)} trên tổng số {sortedCustomers.length} khách hàng
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Trước
                            </button>
                            {[...Array(Math.ceil(sortedCustomers.length / itemsPerPage))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition focus:outline-none ${currentPage === i + 1
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sortedCustomers.length / itemsPerPage), prev + 1))}
                                disabled={currentPage === Math.ceil(sortedCustomers.length / itemsPerPage)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
