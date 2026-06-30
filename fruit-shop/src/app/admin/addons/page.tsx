'use client';

import { useState, useEffect } from 'react';
import { fetchAddons, createAddon, updateAddon, deleteAddon } from '@/services/addonService';
import { fetchCategories } from '@/services/categoriesService';
import { Addon, Category } from '@/types/shop';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

export default function AdminAddonsPage() {
    const [addons, setAddons] = useState<Addon[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState<number | string>(0);
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Delete Confirm Modal States
    const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [addonsData, categoriesData] = await Promise.all([
                fetchAddons(),
                fetchCategories()
            ]);
            setAddons(addonsData);
            setCategories(categoriesData);
            setCurrentPage(1); // Reset to page 1
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách dữ liệu');
            toast.error(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingAddon(null);
        setName('');
        setPrice(0);
        setDescription('');
        setActive(true);
        setSelectedCategoryIds([]);
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (addon: Addon) => {
        setEditingAddon(addon);
        setName(addon.name);
        setPrice(addon.price);
        setDescription(addon.description || '');
        setActive(addon.active);

        // Nạp danh sách các ID danh mục đã được áp dụng cho addon này
        const catIds = addon.allowed_categories
            ? addon.allowed_categories.map(c => typeof c === 'object' ? c._id || c.id : c)
            : [];
        setSelectedCategoryIds(catIds.filter((id): id is string => typeof id === 'string'));

        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setFormError('Tên dịch vụ không được để trống!');
            return;
        }
        if (Number(price) < 0) {
            setFormError('Giá dịch vụ không được nhỏ hơn 0 ₫!');
            return;
        }

        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            let res;
            if (editingAddon && editingAddon._id) {
                res = await updateAddon(
                    editingAddon._id,
                    name.trim(),
                    Number(price) || 0,
                    description,
                    active,
                    selectedCategoryIds
                );
            } else {
                res = await createAddon(
                    name.trim(),
                    Number(price) || 0,
                    description,
                    active,
                    selectedCategoryIds
                );
            }

            if (res) {
                const isEdit = !!editingAddon;
                toast.success(isEdit ? 'Cập nhật dịch vụ thành công!' : 'Thêm dịch vụ mới thành công!');
                setIsModalOpen(false);
                setEditingAddon(null);
                await loadData();
            } else {
                setFormError('Không thể thực hiện tác vụ này');
                toast.error('Có lỗi xảy ra');
            }
        } catch (err: any) {
            setFormError(err.message || 'Có lỗi xảy ra');
            toast.error(err.message || 'Thao tác thất bại');
        } finally {
            setFormLoading(false);
        }
    };

    const handleOpenDeleteConfirm = (addon: Addon) => {
        setAddonToDelete(addon);
        setDeleteError('');
    };

    const confirmDelete = async () => {
        if (!addonToDelete) return;
        const addonId = addonToDelete._id;
        if (!addonId) return;

        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await deleteAddon(addonId);
            if (res) {
                setAddonToDelete(null);
                await loadData();
                toast.success('Xóa dịch vụ thành công!');
            } else {
                setDeleteError('Không thể xóa dịch vụ này');
                toast.error('Xóa thất bại');
            }
        } catch (err: any) {
            setDeleteError(err.message || 'Có lỗi mạng xảy ra');
            toast.error(err.message || 'Thao tác thất bại');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading && addons.length === 0) {
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
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Quản lý Dịch vụ đi kèm</h3>
                    <p className="text-sm text-gray-500 font-medium">Cấu hình các dịch vụ gia tăng như đóng hộp quà, gọt hoa quả, in thiệp và chỉ định danh mục áp dụng.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-600/10 transition whitespace-nowrap focus:outline-none"
                >
                    + Thêm Dịch Vụ
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
                                <th className="px-6 py-4 w-16">#</th>
                                <th className="px-6 py-4 w-48">Tên dịch vụ</th>
                                <th className="px-6 py-4">Mô tả</th>
                                <th className="px-6 py-4 w-44">Danh mục được áp dụng</th>
                                <th className="px-6 py-4 w-28">Đơn giá</th>
                                <th className="px-6 py-4 w-28">Trạng thái</th>
                                <th className="px-6 py-4 w-40 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {addons.length > 0 ? (
                                addons
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((item, index) => {
                                        const itemId = item._id || '';
                                        const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                        
                                        // Danh sách danh mục được hiển thị dưới dạng badge
                                        const appliedCats = item.allowed_categories || [];

                                        return (
                                            <tr key={itemId} className="hover:bg-gray-50/30 transition text-sm">
                                                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                                                    {displayIndex}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                                                    {item.description || <span className="text-gray-300 italic">Không có mô tả</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {appliedCats.length === 0 ? (
                                                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded bg-gray-100 text-gray-500 border border-gray-200">
                                                            Tất cả danh mục
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {appliedCats.map((cat: any, idx) => (
                                                                <span key={cat._id || idx} className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-50 text-green-700 border border-green-100">
                                                                    {cat.name || 'Danh mục đã xóa'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-extrabold text-green-600">
                                                    {item.price === 0 ? 'Miễn phí' : formatCurrency(item.price)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.active ? (
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
                                                            onClick={() => handleOpenEditModal(item)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-green-600 hover:bg-green-50 hover:border-green-300 transition focus:outline-none"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDeleteConfirm(item)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition focus:outline-none"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-400 font-medium">
                                        Không tìm thấy dịch vụ nào. Hãy tạo dịch vụ đầu tiên!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {addons.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <span className="text-xs text-gray-400 font-medium">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, addons.length)} trên tổng số {addons.length} dịch vụ
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Trước
                            </button>
                            {[...Array(Math.ceil(addons.length / itemsPerPage))].map((_, i) => (
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
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(addons.length / itemsPerPage), prev + 1))}
                                disabled={currentPage === Math.ceil(addons.length / itemsPerPage)}
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
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Gradient top highlight bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                        {/* Title */}
                        <div className="flex justify-between items-center mb-5 flex-shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingAddon ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingAddon(null); }}
                                className="text-gray-400 hover:text-gray-600 transition focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        {formError && (
                            <div className="mb-4 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl font-semibold border border-red-100 flex-shrink-0 animate-shake">
                                {formError}
                            </div>
                        )}

                        {formSuccess && (
                            <div className="mb-4 p-3.5 bg-green-50 text-green-600 text-sm rounded-xl font-semibold border border-green-100 flex-shrink-0">
                                {formSuccess}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-grow pr-1.5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tên dịch vụ *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Ví dụ: Gọt sẵn hoa quả, Thêm hộp quà..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Đơn giá (₫) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    value={price}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPrice(val === '' ? '' : Number(val));
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Ví dụ: 15000 (Gõ 0 nếu miễn phí)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mô tả dịch vụ</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 min-h-[60px] resize-none"
                                    placeholder="Ví dụ: Đóng gói hộp kính cao cấp kèm nơ trang trí..."
                                />
                            </div>

                            {/* Category Checkboxes selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Danh mục được áp dụng
                                </label>
                                <p className="text-[10px] text-gray-400 font-semibold mb-2">
                                    Chọn các danh mục áp dụng dịch vụ này. Nếu để trống, dịch vụ sẽ mặc định áp dụng cho tất cả.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 max-h-36 overflow-y-auto">
                                    {categories.map((cat) => {
                                        const catId = cat._id || '';
                                        const isChecked = selectedCategoryIds.includes(catId);
                                        return (
                                            <label 
                                                key={catId} 
                                                className={`flex items-center gap-2.5 p-2 rounded-xl border transition cursor-pointer select-none ${isChecked ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        setSelectedCategoryIds(prev =>
                                                            prev.includes(catId)
                                                                ? prev.filter(id => id !== catId)
                                                                : [...prev, catId]
                                                        );
                                                    }}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                />
                                                <span className="text-xs font-bold">{cat.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActive(!active)}
                                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 focus:outline-none ${active ? 'bg-green-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                                <span className="text-xs font-bold text-gray-700">Kích hoạt dịch vụ này trên cửa hàng</span>
                            </div>

                            <div className="pt-2 flex gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingAddon(null); }}
                                    className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition focus:outline-none"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-1/2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-md shadow-green-100 transition disabled:opacity-50 focus:outline-none"
                                >
                                    {formLoading ? 'Đang lưu...' : (editingAddon ? 'Cập nhật' : 'Lưu lại')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {addonToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden text-center">
                        {/* Red warning top bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-3xl mx-auto mb-4 animate-bounce">
                            ⚠️
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa dịch vụ</h3>

                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa dịch vụ <strong className="text-gray-800">"{addonToDelete.name}"</strong>?
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
                                onClick={() => setAddonToDelete(null)}
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
