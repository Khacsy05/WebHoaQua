'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types/shop';
import { fetchCategories, updateCategory, createCategory, deleteCategory } from '@/services/categoriesService';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Delete Confirm Modal States
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchCategories();
            setCategories(data);
            setCurrentPage(1); // Reset về trang 1 khi load lại
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingCategory(null);
        setName('');
        setDescription('');
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.name);
        setDescription(cat.description || '');
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setFormError('Tên danh mục không được để trống!');
            return;
        }

        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            let res;
            if (editingCategory) {
                const catId = editingCategory._id || editingCategory.id;
                res = await updateCategory(String(catId), name, description);
            } else {
                res = await createCategory(name, description);
            }

            if (res.success) {
                toast.success(editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục mới thành công!');
                setIsModalOpen(false);
                setEditingCategory(null);
                await loadData();
            } else {
                toast.error(res.message || 'Có lỗi xảy ra');
                setFormError(res.message || 'Có lỗi xảy ra');
            }
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
            setFormError(err.message || 'Có lỗi xảy ra');
        } finally {
            setFormLoading(false);
        }
    };

    const handleOpenDeleteConfirm = (cat: Category) => {
        setCategoryToDelete(cat);
        setDeleteError('');
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        const catId = categoryToDelete._id || categoryToDelete.id;
        if (!catId) return;

        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await deleteCategory(String(catId));
            if (res.success) {
                setCategoryToDelete(null);
                await loadData();
                toast.success(res.message);
            } else {
                toast.error(res.message || 'Có lỗi xảy ra');
                setDeleteError(res.message || 'Có lỗi xảy ra');
            }
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
            setDeleteError(err.message || 'Có lỗi xảy ra');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading && categories.length === 0) {
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
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Quản lý Danh mục</h3>
                    <p className="text-sm text-gray-500 font-medium">Xem, thêm, sửa hoặc xóa các danh mục sản phẩm của cửa hàng.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-600/10 transition whitespace-nowrap focus:outline-none"
                >
                    + Thêm Danh Mục
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
                                <th className="px-6 py-4">Tên danh mục</th>
                                <th className="px-6 py-4">Mô tả</th>
                                <th className="px-6 py-4 w-40 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.length > 0 ? (
                                categories
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((cat, index) => {
                                        const catId = cat._id || cat.id || '';
                                        const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr key={catId} className="hover:bg-gray-50/30 transition text-sm">
                                                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                                                    {displayIndex}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {cat.name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium max-w-md truncate">
                                                    {cat.description || <span className="text-gray-300 italic">Không có mô tả</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(cat)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-green-600 hover:bg-green-50 hover:border-green-300 transition focus:outline-none"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDeleteConfirm(cat)}
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
                                    <td colSpan={4} className="text-center py-10 text-gray-400 font-medium">
                                        Không tìm thấy danh mục nào. Hãy thêm danh mục đầu tiên!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {categories.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <span className="text-xs text-gray-400 font-medium">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, categories.length)} trên tổng số {categories.length} danh mục
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Trước
                            </button>
                            {[...Array(Math.ceil(categories.length / itemsPerPage))].map((_, i) => (
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
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(categories.length / itemsPerPage), prev + 1))}
                                disabled={currentPage === Math.ceil(categories.length / itemsPerPage)}
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
                                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}
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
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tên danh mục *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Ví dụ: Trái cây nhập khẩu, Hộp quà tết..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mô tả chi tiết</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 min-h-[100px] resize-none"
                                    placeholder="Mô tả tóm tắt về loại sản phẩm này..."
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}
                                    className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition focus:outline-none"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-1/2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-md shadow-green-100 transition disabled:opacity-50 focus:outline-none"
                                >
                                    {formLoading ? 'Đang lưu...' : (editingCategory ? 'Cập nhật' : 'Lưu lại')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {categoryToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden text-center">
                        {/* Red warning top bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-3xl mx-auto mb-4 animate-bounce">
                            ⚠️
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa danh mục</h3>

                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa danh mục <strong className="text-gray-800">"{categoryToDelete.name}"</strong>?
                            <span className="block mt-2 text-xs text-red-500 font-semibold">Lưu ý: Chỉ có thể xóa nếu danh mục không chứa bất kỳ sản phẩm nào.</span>
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
                                onClick={() => setCategoryToDelete(null)}
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
