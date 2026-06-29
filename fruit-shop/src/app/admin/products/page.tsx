'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/services/productService';
import { fetchCategories } from '@/services/categoriesService';
import { Product, Category } from '@/types/shop';
import { formatCurrency, getProductImage } from '@/utils/helpers';
import { toast } from 'sonner';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | string>(10000);
    const [stock, setStock] = useState<number | string>(10);
    const [categoryId, setCategoryId] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Ref to file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete Confirm Modal States
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodsData, catsData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);
            setProducts(prodsData);
            setCategories(catsData);
            setCurrentPage(1); // Reset về trang 1 khi load
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setName('');
        setDescription('');
        setPrice(10000);
        setStock(10);
        setCategoryId(categories[0]?._id || categories[0]?.id?.toString() || '');
        setImageFile(null);
        setImagePreview('');
        setCurrentImageUrl('');
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (prod: Product) => {
        setEditingProduct(prod);
        setName(prod.name);
        setDescription(prod.description || '');
        setPrice(prod.price);
        setStock(prod.stock);

        // Trích xuất category ID dạng chuỗi
        const catId = typeof prod.category_id === 'object'
            ? (prod.category_id?._id || prod.category_id?.id?.toString() || '')
            : (prod.category_id || '');
        setCategoryId(String(catId));

        setImageFile(null);
        setImagePreview('');
        setCurrentImageUrl(prod.image || '');
        setFormError('');
        setFormSuccess('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setFormError('Tên sản phẩm không được để trống!');
            return;
        }
        if (Number(price) <= 0) {
            setFormError('Giá bán sản phẩm phải lớn hơn 0 ₫!');
            return;
        }
        if (!categoryId) {
            setFormError('Vui lòng chọn danh mục cho sản phẩm!');
            return;
        }

        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            let res;
            if (editingProduct && editingProduct._id) {
                res = await updateProduct(
                    editingProduct._id,
                    name.trim(),
                    Number(price),
                    imageFile,
                    categoryId,
                    description,
                    Number(stock) || 0
                );
            } else {
                res = await createProduct(
                    name.trim(),
                    Number(price),
                    imageFile,
                    categoryId,
                    description,
                    Number(stock) || 0
                );
            }

            // Vì service của sản phẩm ném ra lỗi hoặc trả về data trực tiếp
            // Chúng ta có thể kiểm tra xem kết quả trả về có hợp lệ không
            if (res) {
                const isEdit = !!editingProduct;
                toast.success(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm mới thành công!');
                setIsModalOpen(false);
                setEditingProduct(null);
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

    const handleOpenDeleteConfirm = (prod: Product) => {
        setProductToDelete(prod);
        setDeleteError('');
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        const prodId = productToDelete._id;
        if (!prodId) return;

        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await deleteProduct(prodId);
            if (res) {
                setProductToDelete(null);
                await loadData();
                toast.success('Xóa sản phẩm thành công!');
            } else {
                setDeleteError('Không thể xóa sản phẩm này');
                toast.error('Xóa thất bại');
            }
        } catch (err: any) {
            setDeleteError(err.message || 'Có lỗi mạng xảy ra');
            toast.error(err.message || 'Thao tác thất bại');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Hàm lấy tên danh mục hiển thị
    const getCategoryName = (prod: Product) => {
        if (!prod.category_id) return <span className="text-gray-300 italic text-xs">Chưa phân loại</span>;
        if (typeof prod.category_id === 'object') {
            return prod.category_id.name;
        }
        const matched = categories.find(c => c._id === prod.category_id || c.id?.toString() === prod.category_id);
        return matched ? matched.name : <span className="text-gray-400 text-xs">ID: {prod.category_id}</span>;
    };

    if (loading && products.length === 0) {
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
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Quản lý Sản phẩm</h3>
                    <p className="text-sm text-gray-500 font-medium">Xem, thêm, sửa hoặc xóa các sản phẩm trái cây trong hệ thống cửa hàng.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-600/10 transition whitespace-nowrap focus:outline-none"
                >
                    + Thêm Sản Phẩm
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
                                <th className="px-6 py-4 w-20">Ảnh</th>
                                <th className="px-6 py-4">Tên sản phẩm</th>
                                <th className="px-6 py-4">Danh mục</th>
                                <th className="px-6 py-4">Giá bán</th>
                                <th className="px-6 py-4">Kho hàng</th>
                                <th className="px-6 py-4 w-40 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.length > 0 ? (
                                products
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((prod, index) => {
                                        const prodId = prod._id || '';
                                        const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;

                                        return (
                                            <tr key={prodId} className="hover:bg-gray-50/30 transition text-sm">
                                                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                                                    {displayIndex}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {prod.image ? (
                                                        <img
                                                            src={getProductImage(prod.image)}
                                                            alt={prod.name}
                                                            className="w-12 h-12 object-cover bg-gray-50 rounded-xl border border-gray-100"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-300 text-lg">
                                                            🍎
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{prod.name}</div>
                                                    {prod.description && (
                                                        <div className="text-xs text-gray-400 max-w-xs truncate">{prod.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-700">
                                                    {getCategoryName(prod)}
                                                </td>
                                                <td className="px-6 py-4 font-extrabold text-green-600">
                                                    {formatCurrency(prod.price)}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-800">
                                                    {prod.stock} <span className="text-[10px] text-gray-400 font-medium">sản phẩm</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(prod)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-green-600 hover:bg-green-50 hover:border-green-300 transition focus:outline-none"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDeleteConfirm(prod)}
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
                                        Không tìm thấy sản phẩm nào. Hãy tạo sản phẩm trái cây đầu tiên!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {products.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <span className="text-xs text-gray-400 font-medium">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, products.length)} trên tổng số {products.length} sản phẩm
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white focus:outline-none"
                            >
                                Trước
                            </button>
                            {[...Array(Math.ceil(products.length / itemsPerPage))].map((_, i) => (
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
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(products.length / itemsPerPage), prev + 1))}
                                disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
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
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden">
                        {/* Gradient top highlight bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                        {/* Title */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
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
                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tên sản phẩm *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                        placeholder="Ví dụ: Nho mẫu đơn, Táo Envy..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Danh mục *</label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 bg-white"
                                    >
                                        <option value="" disabled>-- Chọn danh mục --</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id || cat.id} value={cat._id || cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Giá bán (₫) *</label>
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
                                        placeholder="Ví dụ: 80000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Kho hàng *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="1"
                                        value={stock}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setStock(val === '' ? '' : Number(val));
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                        placeholder="Ví dụ: 100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mô tả sản phẩm</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 min-h-[80px] resize-none"
                                    placeholder="Thông tin nguồn gốc, đặc điểm sản phẩm..."
                                />
                            </div>

                            {/* Image Upload Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Ảnh sản phẩm</label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <div className="flex items-center gap-4">
                                    {/* Preview Block */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50/10 transition overflow-hidden bg-gray-50 relative group"
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : currentImageUrl ? (
                                            <img src={getProductImage(currentImageUrl)} alt="Current" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <span className="text-2xl text-gray-400 group-hover:scale-110 transition inline-block">📸</span>
                                                <p className="text-[10px] text-gray-400 mt-1 font-semibold">Chọn ảnh</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition focus:outline-none"
                                        >
                                            {imagePreview || currentImageUrl ? 'Thay đổi ảnh' : 'Tải lên ảnh mới'}
                                        </button>
                                        <p className="text-[10px] text-gray-400 font-medium">Chấp nhận JPG, PNG, WEBP. Dung lượng tối đa 5MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
                                    className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition focus:outline-none"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-1/2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-md shadow-green-100 transition disabled:opacity-50 focus:outline-none"
                                >
                                    {formLoading ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Lưu lại')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {productToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden text-center">
                        {/* Red warning top bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-3xl mx-auto mb-4 animate-bounce">
                            ⚠️
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa sản phẩm</h3>

                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-gray-800">"{productToDelete.name}"</strong>?
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
                                onClick={() => setProductToDelete(null)}
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
