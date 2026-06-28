'use client';

import { useState, useEffect } from 'react';
import { fetchAllPromotions, createPromotion, updatePromotion, deletePromotion } from '@/services/promotionService';
import { Promotion } from '@/types/shop';
import { formatCurrency } from '@/utils/helpers';

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('code');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [thresholdAmount, setThresholdAmount] = useState<number>(0);
    const [active, setActive] = useState(true);

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Delete Confirm Modal States
    const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAllPromotions();
            setPromotions(data);
            setCurrentPage(1); // Reset về trang 1 khi reload
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Format ngày sang kiểu YYYY-MM-DD để đưa vào input date
    const formatDateForInput = (dateVal: string | Date | undefined) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format ngày hiển thị tiếng Việt DD/MM/YYYY
    const formatDateDisplay = (dateVal: string | Date) => {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('vi-VN');
    };

    const handleOpenCreateModal = () => {
        setEditingPromotion(null);
        setName('');
        setType('code');
        setStartDate(formatDateForInput(new Date()));
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setEndDate(formatDateForInput(nextWeek));
        setDiscountPercent(10);
        setThresholdAmount(0);
        setActive(true);
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (promo: Promotion) => {
        setEditingPromotion(promo);
        setName(promo.name);
        setType(promo.type);
        setStartDate(formatDateForInput(promo.start_date));
        setEndDate(formatDateForInput(promo.end_date));
        setDiscountPercent(promo.discount_percent);
        setThresholdAmount(promo.threshold_amount || 0);
        setActive(promo.active);
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setFormError('Tên chương trình khuyến mãi không được để trống!');
            return;
        }
        if (discountPercent <= 0 || discountPercent > 100) {
            setFormError('Phần trăm giảm giá phải nằm trong khoảng từ 0% đến 100%!');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setFormError('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
            return;
        }

        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        const payload = {
            name: name.trim(),
            type,
            start_date: new Date(startDate),
            end_date: new Date(endDate),
            discount_percent: Number(discountPercent),
            threshold_amount: Number(thresholdAmount),
            active
        };

        try {
            let res;
            if (editingPromotion && editingPromotion._id) {
                res = await updatePromotion(editingPromotion._id, payload);
            } else {
                res = await createPromotion(payload);
            }

            if (res.success) {
                setFormSuccess(editingPromotion ? 'Cập nhật khuyến mãi thành công!' : 'Thêm khuyến mãi mới thành công!');
                await loadData();
                setTimeout(() => {
                    setIsModalOpen(false);
                    setEditingPromotion(null);
                }, 1200);
            } else {
                setFormError(res.message || 'Không thể thực hiện tác vụ này');
            }
        } catch (err: any) {
            setFormError(err.message || 'Có lỗi xảy ra');
        } finally {
            setFormLoading(false);
        }
    };

    const handleOpenDeleteConfirm = (promo: Promotion) => {
        setPromoToDelete(promo);
        setDeleteError('');
    };

    const confirmDelete = async () => {
        if (!promoToDelete) return;
        const promoId = promoToDelete._id;
        if (!promoId) return;

        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await deletePromotion(promoId);
            if (res.success) {
                setPromoToDelete(null);
                await loadData();
            } else {
                setDeleteError(res.message || 'Không thể xóa khuyến mãi này');
            }
        } catch (err: any) {
            setDeleteError(err.message || 'Có lỗi mạng xảy ra');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading && promotions.length === 0) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100">
                    <div className="h-6 bg-gray-100 rounded w-48"></div>
                    <div className="h-10 bg-gray-100 rounded w-32"></div>
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
            {/* Header section with add button */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Quản lý Khuyến mãi</h3>
                    <p className="text-sm text-gray-500 font-medium">Xem, tạo, sửa hoặc xóa các mã giảm giá và chiến dịch ưu đãi tại cửa hàng.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-600/10 transition whitespace-nowrap focus:outline-none"
                >
                    + Thêm Khuyến Mãi
                </button>
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
                                <th className="px-6 py-4 w-20">#</th>
                                <th className="px-6 py-4">Tên chương trình</th>
                                <th className="px-6 py-4">Loại</th>
                                <th className="px-6 py-4">Mức giảm</th>
                                <th className="px-6 py-4">Đơn tối thiểu</th>
                                <th className="px-6 py-4">Từ ngày</th>
                                <th className="px-6 py-4">Đến ngày</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 w-40 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {promotions.length > 0 ? (
                                promotions
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((promo, index) => {
                                        const promoId = promo._id || '';
                                        const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;

                                        // Kiểm tra xem khuyến mãi đã hết hạn chưa
                                        const isExpired = new Date(promo.end_date) < new Date();

                                        return (
                                            <tr key={promoId} className="hover:bg-gray-50/30 transition text-sm">
                                                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                                                    {displayIndex}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {promo.name}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs">
                                                    {promo.type}
                                                </td>
                                                <td className="px-6 py-4 font-extrabold text-green-600">
                                                    {promo.discount_percent}%
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-800">
                                                    {formatCurrency(promo.threshold_amount || 0)}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium">
                                                    {formatDateDisplay(promo.start_date)}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium">
                                                    {formatDateDisplay(promo.end_date)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isExpired ? (
                                                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-red-50 text-red-500 border-red-100">
                                                            Hết hạn
                                                        </span>
                                                    ) : promo.active ? (
                                                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-green-50 text-green-700 border-green-100">
                                                            Kích hoạt
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-gray-50 text-gray-400 border-gray-100">
                                                            Tạm dừng
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(promo)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-green-600 hover:bg-green-50 hover:border-green-300 transition focus:outline-none"
                                                        >
                                                            ✏️ Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDeleteConfirm(promo)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition focus:outline-none"
                                                        >
                                                            🗑️ Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-gray-400 font-medium">
                                        Không tìm thấy chương trình khuyến mãi nào. Hãy tạo ưu đãi đầu tiên!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {promotions.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <span className="text-xs text-gray-400 font-medium">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, promotions.length)} trên tổng số {promotions.length} mã khuyến mãi
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Trước
                            </button>
                            {[...Array(Math.ceil(promotions.length / itemsPerPage))].map((_, i) => (
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
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(promotions.length / itemsPerPage), prev + 1))}
                                disabled={currentPage === Math.ceil(promotions.length / itemsPerPage)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden">
                        {/* Gradient top highlight bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                        {/* Title */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingPromotion ? 'Chỉnh sửa chương trình' : 'Thêm khuyến mãi mới'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingPromotion(null); }}
                                className="text-gray-400 hover:text-gray-600 transition focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        {formError && (
                            <div className="mb-4 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl font-semibold border border-red-100">
                                {formError}
                            </div>
                        )}

                        {formSuccess && (
                            <div className="mb-4 p-3.5 bg-green-50 text-green-600 text-sm rounded-xl font-semibold border border-green-100">
                                {formSuccess}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tên chương trình *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Ví dụ: Giảm giá hè, Code FREESHIP..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Loại *</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 bg-white"
                                    >
                                        <option value="code">Mã giảm giá (Code)</option>
                                        <option value="bulk">Mua sỉ (Bulk)</option>
                                        <option value="holiday">Dịp lễ (Holiday)</option>
                                        <option value="sale">Xả hàng (Sale)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Giảm giá (%) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        step="0.5"
                                        value={discountPercent || ''}
                                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                        placeholder="Ví dụ: 10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Giá trị đơn hàng tối thiểu (₫)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={thresholdAmount}
                                    onChange={(e) => setThresholdAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Ví dụ: 200000"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Ngày bắt đầu *</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Ngày kết thúc *</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <label htmlFor="active" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                                    Kích hoạt hoạt động ngay lập tức
                                </label>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingPromotion(null); }}
                                    className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition focus:outline-none"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-1/2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-md shadow-green-100 transition disabled:opacity-50 focus:outline-none"
                                >
                                    {formLoading ? 'Đang lưu...' : (editingPromotion ? 'Cập nhật' : 'Lưu lại')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {promoToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden text-center">
                        {/* Red warning top bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-3xl mx-auto mb-4 animate-bounce">
                            ⚠️
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa khuyến mãi</h3>

                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa chương trình khuyến mãi <strong className="text-gray-800">"{promoToDelete.name}"</strong>?
                            <span className="block mt-2 text-xs text-red-500 font-semibold">Lưu ý: Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác.</span>
                        </p>

                        {/* Error message inside modal */}
                        {deleteError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold border border-red-100 text-left">
                                {deleteError}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={() => setPromoToDelete(null)}
                                className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition focus:outline-none disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={confirmDelete}
                                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-100 transition disabled:opacity-50 focus:outline-none"
                            >
                                {deleteLoading ? 'Đang xóa...' : 'Đồng ý xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
