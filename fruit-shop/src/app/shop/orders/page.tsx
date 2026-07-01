'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchOrders, updateOrderStatus } from '@/services/orderService';
import { Order } from '@/types/shop';
import { formatCurrency, getProductImage } from '@/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export default function CustomerOrdersPage() {
    const router = useRouter();
    const { loadUser } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // State quản lý chi tiết đóng/mở rộng từng dòng trong bảng
    const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

    // State xử lý trạng thái lọc đơn hàng
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // State xử lý hủy đơn hàng
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchOrders();
            setOrders(data);
            setCurrentPage(1);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách đơn hàng');
            toast.error(err.message || 'Không thể tải đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await loadUser();
            if (!currentUser) {
                toast.error("Vui lòng đăng nhập để xem đơn hàng của bạn!");
                router.push('/login');
            } else if (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_MANAGER') {
                // Tránh Admin/Manager truy cập trang lịch sử đơn hàng của Customer, chuyển hướng về trang admin quản lý đơn hàng
                toast.info("Tài khoản quản lý được chuyển hướng đến kênh quản trị đơn hàng");
                router.push('/admin/orders');
            } else {
                loadData();
            }
        };
        checkAuth();
    }, [router]);

    // Xử lý mở/đóng chi tiết đơn hàng
    const toggleExpandOrder = (orderId: string) => {
        setExpandedOrderIds(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    // Xử lý Hủy đơn hàng phía khách hàng
    const handleCancelOrder = async (orderId: string) => {
        setCancellingOrderId(orderId);
        try {
            const res = await updateOrderStatus(orderId, 'CANCELLED');
            if (res.success) {
                toast.success("Hủy đơn hàng thành công!");
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'CANCELLED' } : o));
            } else {
                toast.error(res.message || "Không thể hủy đơn hàng này");
            }
        } catch (err: any) {
            toast.error(err.message || "Có lỗi mạng xảy ra khi hủy đơn");
        } finally {
            setCancellingOrderId(null);
        }
    };

    // Helper định dạng ngày hiển thị đơn hàng
    const formatDateDisplay = (dateVal?: string | Date) => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Helper hiển thị badge trạng thái đơn hàng
    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-yellow-50 text-yellow-600 border border-yellow-100 font-sans">
                        Chờ duyệt
                    </span>
                );
            case 'SHIPPING':
                return (
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-sans">
                        Đang giao
                    </span>
                );
            case 'DELIVERED':
                return (
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-100 font-sans">
                        Đã giao
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100 font-sans">
                        Đã hủy
                    </span>
                );
            default:
                return (
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-50 text-gray-500 border border-gray-100 font-sans">
                        Chưa rõ
                    </span>
                );
        }
    };

    const filteredOrders = statusFilter === 'ALL'
        ? orders
        : orders.filter(order => order.status === statusFilter);

    if (loading && orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-10 px-4">
                <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 h-96"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header breadcrumb & Title */}
                <div className="flex items-center justify-between text-xs">
                    <Link
                        href="/shop"
                        className="text-green-600 hover:text-green-700 font-bold flex items-center gap-1 transition focus:outline-none"
                    >
                        &larr; Tiếp tục mua sắm
                    </Link>
                    <span className="text-gray-400 font-medium font-mono">Đơn hàng của tôi</span>
                </div>

                <div className="text-center space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Đơn hàng của tôi</h1>
                    <p className="text-xs text-gray-500 font-semibold font-sans">Xem hành trình giao nhận và lịch sử các gói hàng của bạn.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-3xl border border-red-100 font-bold text-center text-xs animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm justify-center md:justify-start">
                    {[
                        { code: 'ALL', name: 'Tất cả' },
                        { code: 'PENDING', name: 'Chờ duyệt' },
                        { code: 'SHIPPING', name: 'Đang giao' },
                        { code: 'DELIVERED', name: 'Đã giao' },
                        { code: 'CANCELLED', name: 'Đã hủy' }
                    ].map(tab => (
                        <button
                            key={tab.code}
                            onClick={() => {
                                setStatusFilter(tab.code);
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none ${statusFilter === tab.code
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 bg-gray-50/50'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4 w-16 text-center">STT</th>
                                    <th className="px-6 py-4">Mã Đơn hàng</th>
                                    <th className="px-6 py-4">Thời gian đặt</th>
                                    <th className="px-6 py-4">Tổng thanh toán (₫)</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-center w-48">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((order, index) => {
                                            const orderId = order._id || '';
                                            const orderCode = orderId.substring(orderId.length - 8).toUpperCase();
                                            const isExpanded = !!expandedOrderIds[orderId];
                                            const items = order.items || [];
                                            const canCancel = order.status === 'PENDING';
                                            const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;

                                            return (
                                                <tr key={orderId} className="hover:bg-gray-50/10 transition text-sm">
                                                    <td colSpan={6} className="p-0">
                                                        <table className="w-full border-collapse">
                                                            <tbody>
                                                                {/* Main Row */}
                                                                <tr className="hover:bg-gray-50/20 transition text-sm">
                                                                    <td className="px-6 py-4 font-mono text-gray-400 text-xs text-center w-16">
                                                                        {globalIndex}
                                                                    </td>
                                                                    <td className="px-6 py-4 font-bold text-gray-950 font-mono text-xs">
                                                                        #{orderCode}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-gray-500 font-semibold text-xs">
                                                                        {formatDateDisplay(order.createdAt)}
                                                                    </td>
                                                                    <td className="px-6 py-4 font-extrabold text-red-600">
                                                                        {formatCurrency(order.payable_amount)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        {getStatusBadge(order.status)}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center w-48">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button
                                                                                onClick={() => toggleExpandOrder(orderId)}
                                                                                className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold transition focus:outline-none"
                                                                            >
                                                                                {isExpanded ? 'Thu gọn ▲' : 'Chi tiết ▼'}
                                                                            </button>
                                                                            {canCancel && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                                                                                            handleCancelOrder(orderId);
                                                                                        }
                                                                                    }}
                                                                                    disabled={cancellingOrderId === orderId}
                                                                                    className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition focus:outline-none disabled:opacity-50"
                                                                                >
                                                                                    {cancellingOrderId === orderId ? 'Hủy...' : 'Hủy đơn'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* Expanded Details Row */}
                                                                {isExpanded && (
                                                                    <tr className="bg-gray-50/40">
                                                                        <td colSpan={6} className="px-6 py-4 border-t border-b border-gray-100">
                                                                            <div className="space-y-3">
                                                                                <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">📦 Danh sách sản phẩm trong đơn hàng:</h4>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    {items.map((item, idx) => {
                                                                                        const prodName = item.product_id?.name || 'Sản phẩm đã xóa';
                                                                                        const prodImg = item.product_id?.image || '';
                                                                                        return (
                                                                                            <div key={item._id || idx} className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100/80 shadow-sm text-xs">
                                                                                                {prodImg ? (
                                                                                                    <img
                                                                                                        src={getProductImage(prodImg)}
                                                                                                        alt={prodName}
                                                                                                        className="w-11 h-11 object-cover rounded-xl border bg-gray-50 flex-shrink-0"
                                                                                                    />
                                                                                                ) : (
                                                                                                    <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-300 border flex-shrink-0">
                                                                                                        🍎
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="flex-grow min-w-0">
                                                                                                    <h5 className="font-bold text-gray-950 truncate">{prodName}</h5>
                                                                                                    <div className="flex justify-between items-center text-gray-400 mt-0.5 font-semibold text-[11px]">
                                                                                                        <span>Đơn giá: {formatCurrency(item.unit_price)}</span>
                                                                                                        <span className="text-gray-700">Số lượng: x{item.quantity}</span>
                                                                                                    </div>
                                                                                                    {item.addons && item.addons.length > 0 && (
                                                                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                                                                            {item.addons.map((addonStr: string, indexAddon: number) => (
                                                                                                                <span key={indexAddon} className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-[9px] rounded font-semibold border border-green-100">
                                                                                                                    🛠️ {addonStr}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <div className="space-y-3">
                                                <span className="text-4xl block">🛍️</span>
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    {orders.length === 0
                                                        ? "Bạn chưa có đơn đặt hàng nào"
                                                        : "Không tìm thấy đơn hàng nào"}
                                                </h3>
                                                <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                                                    {orders.length === 0
                                                        ? "Hãy lựa chọn những loại trái cây tươi ngon đầu tiên cho giỏ hàng của bạn!"
                                                        : "Bạn thử chọn bộ lọc trạng thái khác xem sao nhé."}
                                                </p>
                                                {orders.length === 0 && (
                                                    <Link
                                                        href="/shop"
                                                        className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-4 py-2 rounded-xl shadow-lg shadow-green-600/10 transition"
                                                    >
                                                        Mua sắm ngay
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredOrders.length > itemsPerPage && (
                        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                            <span className="text-xs text-gray-400 font-medium font-mono">
                                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} trên tổng số {filteredOrders.length} đơn hàng
                            </span>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                                >
                                    Trước
                                </button>
                                {[...Array(Math.ceil(filteredOrders.length / itemsPerPage))].map((_, i) => (
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
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
