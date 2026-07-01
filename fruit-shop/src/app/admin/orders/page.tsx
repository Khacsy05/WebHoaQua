'use client';

import { useState, useEffect } from 'react';
import { fetchOrders, fetchOrderById, updateOrderStatus } from '@/services/orderService';
import { Order } from '@/types/shop';
import { formatCurrency, getProductImage } from '@/utils/helpers';
import { toast } from 'sonner';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Detail Modal States
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await fetchOrders();
            setOrders(data);
            setCurrentPage(1);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách đơn hàng');
            toast.error(err.message || 'Lỗi tải đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // Khóa cuộn trang nền khi mở modal chi tiết đơn hàng
    useEffect(() => {
        if (isDetailModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDetailModalOpen]);

    // Mở Modal chi tiết đơn hàng
    const handleOpenDetailModal = async (order: Order) => {
        if (!order._id) return;
        setDetailLoading(true);
        setSelectedOrder(order);
        try {
            const res = await fetchOrderById(order._id);
            if (res) {
                setSelectedOrder(res.order);
                setOrderItems(res.items || []);
                setIsDetailModalOpen(true);
            } else {
                toast.error("Không thể tải chi tiết đơn hàng");
            }
        } catch (err: any) {
            toast.error(err.message || "Lỗi tải chi tiết đơn hàng");
        } finally {
            setDetailLoading(false);
        }
    };

    // Cập nhật trạng thái đơn hàng trực tiếp
    const handleUpdateStatus = async (status: string) => {
        if (!selectedOrder || !selectedOrder._id) return;
        try {
            const res = await updateOrderStatus(selectedOrder._id, status);
            if (res.success) {
                toast.success("Cập nhật trạng thái thành công!");
                // Cập nhật UI ngay trong Modal
                setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
                // Tải lại danh sách nền
                const data = await fetchOrders();
                setOrders(data);
            } else {
                toast.error(res.message || "Cập nhật thất bại");
            }
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra");
        }
    };

    // Hàm phụ trợ lấy thông tin Khách hàng
    const getCustomerInfo = (order: Order) => {
        if (!order.customer_id) return { name: 'Khách vãng lai', detail: 'N/A' };
        if (typeof order.customer_id === 'object') {
            return {
                name: order.customer_id.name,
                detail: order.customer_id.phone || order.customer_id.email || 'N/A'
            };
        }
        return { name: 'ID: ' + order.customer_id, detail: 'N/A' };
    };

    // Định dạng ngày hiển thị
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

    // Helper dịch Trạng thái đơn hàng & gán class màu sắc tương ứng
    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-yellow-50 text-yellow-600 border-yellow-100">
                        Chờ duyệt
                    </span>
                );
            case 'SHIPPING':
                return (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-purple-50 text-purple-600 border-purple-100">
                        Đang giao
                    </span>
                );
            case 'DELIVERED':
                return (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-green-50 text-green-700 border-green-100">
                        Đã giao
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-red-50 text-red-600 border-red-100">
                        Đã hủy
                    </span>
                );
            default:
                return (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-gray-50 text-gray-500 border-gray-100">
                        Chưa rõ
                    </span>
                );
        }
    };

    // Lọc danh sách đơn hàng theo trạng thái đã chọn
    const filteredOrders = statusFilter === 'ALL'
        ? orders
        : orders.filter(order => order.status === statusFilter);

    if (loading && orders.length === 0) {
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
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Quản lý Đơn hàng</h3>
                    <p className="text-sm text-gray-500 font-medium">Theo dõi, kiểm tra chi tiết và duyệt trạng thái các đơn đặt hàng trên hệ thống.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition focus:outline-none ${statusFilter === tab.code
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-950'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl border border-red-100 font-semibold text-center text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* List Table (Đã lược bỏ các cột phụ, chỉ giữ lại Thực thu và Thao tác chi tiết) */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 w-20">STT</th>
                                <th className="px-6 py-4">Mã Đơn</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4">Thời gian đặt</th>
                                <th className="px-6 py-4">Thực thu (₫)</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 w-32 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? (
                                filteredOrders
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((order, index) => {
                                        const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                        const custInfo = getCustomerInfo(order);

                                        return (
                                            <tr key={order._id} className="hover:bg-gray-50/30 transition text-sm">
                                                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                                                    {displayIndex}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900 font-mono text-xs">
                                                    #{order._id?.substring(order._id.length - 8).toUpperCase() || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{custInfo.name}</div>
                                                    <div className="text-xs text-gray-400 font-medium">{custInfo.detail}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-semibold text-xs">
                                                    {formatDateDisplay(order.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 font-extrabold text-green-600">
                                                    {formatCurrency(order.payable_amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(order.status)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenDetailModal(order)}
                                                        disabled={detailLoading && selectedOrder?._id === order._id}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-green-600 hover:bg-green-50 hover:border-green-300 transition focus:outline-none disabled:opacity-50"
                                                    >
                                                        {detailLoading && selectedOrder?._id === order._id ? ' Tải...' : ' Chi tiết'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">
                                        Không tìm thấy đơn đặt hàng nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredOrders.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <span className="text-xs text-gray-400 font-medium">
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

            {/* DETAILED MODAL: 2 COLUMNS */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Gradient top highlight bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    Chi tiết đơn hàng <span className="font-mono text-sm text-gray-400">#{selectedOrder._id?.substring(selectedOrder._id.length - 8).toUpperCase()}</span>
                                </h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Đặt lúc: {formatDateDisplay(selectedOrder.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => { setIsDetailModalOpen(false); setSelectedOrder(null); setOrderItems([]); }}
                                className="text-gray-400 hover:text-gray-600 transition focus:outline-none p-1 rounded-lg hover:bg-gray-50"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body: Two Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-grow">

                            {/* COLUMN LEFT: Info & Update Status */}
                            <div className="space-y-6">
                                {/* Section 1: Customer Info */}
                                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">👤 Thông tin giao hàng</h4>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Họ và tên:</span>
                                            <span className="font-bold text-gray-900">{getCustomerInfo(selectedOrder).name}</span>
                                        </div>
                                        {typeof selectedOrder.customer_id === 'object' && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 font-medium">Email khách:</span>
                                                    <span className="font-semibold text-gray-700">{selectedOrder.customer_id.email}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 font-medium">Số điện thoại:</span>
                                                    <span className="font-bold text-gray-900">{selectedOrder.customer_id.phone || 'Chưa cập nhật'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium">Địa chỉ nhận hàng:</span>
                                                    <span className="font-semibold text-gray-700 bg-white p-3.5 rounded-xl border border-gray-100 leading-relaxed text-xs">
                                                        {selectedOrder.customer_id.address || 'Chưa cập nhật địa chỉ giao hàng'}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                 {/* Section 2: Update Status */}
                                 <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                     <div className="flex items-center justify-between">
                                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">⚙️ Cập nhật trạng thái</h4>
                                         <div>{getStatusBadge(selectedOrder.status)}</div>
                                     </div>
 
                                     <div className="space-y-3">
                                         {selectedOrder.status === 'PENDING' && (
                                             <>
                                                 <label className="block text-xs font-bold text-gray-500">Thao tác xử lý đơn hàng:</label>
                                                 <div className="grid grid-cols-2 gap-3">
                                                     <button
                                                         onClick={() => handleUpdateStatus('CANCELLED')}
                                                         className="px-3 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition active:scale-[0.98]"
                                                     >
                                                         ❌ Hủy đơn hàng
                                                     </button>
                                                     <button
                                                         onClick={() => handleUpdateStatus('SHIPPING')}
                                                         className="px-3 py-2.5 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition active:scale-[0.98] shadow-md shadow-green-600/10"
                                                     >
                                                         🚀 Xác nhận & Giao
                                                     </button>
                                                 </div>
                                             </>
                                         )}
 
                                         {selectedOrder.status === 'SHIPPING' && (
                                             <>
                                                 <label className="block text-xs font-bold text-gray-500">Thao tác xử lý đơn hàng:</label>
                                                 <div className="grid grid-cols-2 gap-3">
                                                     <button
                                                         onClick={() => handleUpdateStatus('CANCELLED')}
                                                         className="px-3 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition active:scale-[0.98]"
                                                     >
                                                         ❌ Hủy đơn hàng
                                                     </button>
                                                     <button
                                                         onClick={() => handleUpdateStatus('DELIVERED')}
                                                         className="px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition active:scale-[0.98] shadow-md shadow-blue-600/10"
                                                     >
                                                         ✅ Đã giao hàng
                                                     </button>
                                                 </div>
                                             </>
                                         )}
 
                                         {selectedOrder.status === 'DELIVERED' && (
                                             <div className="bg-green-50 text-green-800 p-3.5 rounded-xl border border-green-100 text-xs font-bold text-center leading-relaxed font-sans">
                                                 ✅ Đơn hàng này đã hoàn thành.
                                             </div>
                                         )}
 
                                         {selectedOrder.status === 'CANCELLED' && (
                                             <div className="bg-red-50 text-red-800 p-3.5 rounded-xl border border-red-100 text-xs font-bold text-center leading-relaxed font-sans">
                                                 ❌ Đơn hàng này đã bị hủy bỏ.
                                             </div>
                                         )}
                                     </div>
                                 </div>
                            </div>

                            {/* COLUMN RIGHT: Product Details List */}
                            <div className="flex flex-col justify-between bg-gray-50/20 p-5 rounded-2xl border border-gray-100">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">📦 Danh sách sản phẩm mua</h4>

                                    <div className="space-y-3 divide-y max-h-[300px] overflow-y-auto pr-1">
                                        {orderItems.map((item, index) => {
                                            const product = item.product_id;
                                            const prodName = product?.name || 'Sản phẩm đã bị xóa';
                                            const prodImg = product?.image || '';

                                            return (
                                                <div key={item._id || index} className="flex gap-3 pt-3 first:pt-0">
                                                    {prodImg ? (
                                                        <img
                                                            src={getProductImage(prodImg)}
                                                            alt={prodName}
                                                            className="w-12 h-12 object-cover rounded-xl border"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-lg text-gray-300">
                                                            🍎
                                                        </div>
                                                    )}
                                                    <div className="flex-grow min-w-0">
                                                        <h5 className="text-sm font-bold text-gray-900 truncate">{prodName}</h5>
                                                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500 font-semibold">
                                                            <span>Đơn giá: {formatCurrency(item.unit_price)}</span>
                                                            <span>SL: {item.quantity}</span>
                                                        </div>

                                                        {/* Các dịch vụ đi kèm */}
                                                        {item.addons && item.addons.length > 0 && (
                                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                                {item.addons.map((addonStr: string, idx: number) => (
                                                                    <span key={idx} className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded border border-green-100 font-semibold">
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

                                {/* Payment Totals block */}
                                <div className="border-t pt-4 mt-6 space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Tổng tiền hàng:</span>
                                        <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-500 font-medium">
                                        <span>Khấu trừ giảm giá:</span>
                                        <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                                    </div>
                                    <div className="flex justify-between font-extrabold text-gray-950 border-t pt-2 text-md">
                                        <span>Thành tiền thực thu:</span>
                                        <span className="text-red-600 text-lg">{formatCurrency(selectedOrder.payable_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="mt-6 pt-4 border-t flex justify-end">
                            <button
                                onClick={() => { setIsDetailModalOpen(false); setSelectedOrder(null); setOrderItems([]); }}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition focus:outline-none"
                            >
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
