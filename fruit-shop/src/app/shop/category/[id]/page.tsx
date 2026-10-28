'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useShopStore } from '@/store/useShopStore';
import { Product, Category } from '@/types/shop';
import { fetchProducts } from '@/services/productService';
import { formatCurrency, getProductImage } from '@/utils/helpers';

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params?.id as string;
    const { categories, loadShopData } = useShopStore();

    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (categories.length === 0) {
            loadShopData(null, false, true);
        }
    }, [categories.length, loadShopData]);

    useEffect(() => {
        if (!categoryId) return;

        // Find current category info
        const found = categories.find(c => String(c._id || c.id) === String(categoryId));
        if (found) setCurrentCategory(found);

        const loadProducts = async () => {
            setLoading(true);
            try {
                const data = await fetchProducts(categoryId);
                setCategoryProducts(data);
            } catch (err) {
                console.error("Lỗi khi tải sản phẩm danh mục:", err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [categoryId, categories]);

    // Price sort
    let sortedProducts = [...categoryProducts];
    if (priceSort === 'asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
    }

    return (
        <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans">
            <Header />

            <main className="flex-1 py-8 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                        <Link href="/shop" className="hover:text-[#0b8043] transition">Trang chủ</Link>
                        <span>/</span>
                        <span className="text-gray-400">Danh mục</span>
                        <span>/</span>
                        <span className="text-[#0b8043] font-bold">{currentCategory?.name || 'Chi tiết danh mục'}</span>
                    </div>

                    {/* Category Header Banner */}
                    <div className="bg-gradient-to-r from-[#0b8043] to-[#15a258] text-white rounded-3xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl">
                                {currentCategory?.icon || '🍏'}
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                    {currentCategory?.name || 'Danh mục sản phẩm'}
                                </h1>
                                <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl">
                                    {currentCategory?.description || 'Tuyển chọn trái cây tươi ngon, giàu vitamin và đảm bảo an toàn vệ sinh thực phẩm.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-2xl self-start md:self-auto text-xs font-semibold">
                            Tổng cộng: <strong className="text-white">{categoryProducts.length}</strong> sản phẩm
                        </div>
                    </div>

                    {/* Filter & Sort Bar */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                            <span>Danh mục khác:</span>
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                {categories.slice(0, 5).map(cat => {
                                    const catId = cat._id || cat.id;
                                    const isActive = String(catId) === String(categoryId);
                                    return (
                                        <Link
                                            key={catId}
                                            href={`/shop/category/${catId}`}
                                            className={`px-3 py-1 rounded-full text-xs transition ${isActive ? 'bg-[#0b8043] text-white font-bold' : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-[#0b8043]'}`}
                                        >
                                            {cat.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Sắp xếp giá:</span>
                            <select
                                value={priceSort}
                                onChange={(e) => setPriceSort(e.target.value as any)}
                                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b8043] cursor-pointer"
                            >
                                <option value="default">Mặc định</option>
                                <option value="asc">Giá: Thấp &rarr; Cao</option>
                                <option value="desc">Giá: Cao &rarr; Thấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-64 animate-pulse"></div>
                            ))}
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-2xs">
                            <div className="text-5xl mb-3">🧺</div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">Chưa có sản phẩm nào trong danh mục này</h3>
                            <p className="text-xs text-gray-500 mb-4">Các sản phẩm đang được cập nhật thêm, bạn vui lòng quay lại sau nhé!</p>
                            <Link href="/shop" className="inline-block px-5 py-2.5 bg-[#0b8043] hover:bg-[#096d39] text-white text-xs font-bold rounded-xl transition shadow-sm">
                                Khám phá các danh mục khác
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                            {sortedProducts.map(product => {
                                const prodId = product._id || product.id;
                                const imgPath = getProductImage(product.image);
                                return (
                                    <div
                                        key={prodId}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
                                    >
                                        <Link href={`/shop/products/${prodId}`} className="relative h-44 bg-gray-50/50 flex items-center justify-center p-3 overflow-hidden">
                                            <img
                                                src={imgPath}
                                                alt={product.name}
                                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                                            />
                                            {product.stock <= 0 && (
                                                <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                                    Hết hàng
                                                </span>
                                            )}
                                        </Link>

                                        <div className="p-4 flex flex-col flex-1">
                                            <span className="text-[10px] font-bold text-[#0b8043] uppercase tracking-wider mb-1">
                                                {currentCategory?.name || 'Trái cây'}
                                            </span>
                                            <Link href={`/shop/products/${prodId}`}>
                                                <h4 className="text-xs md:text-sm font-bold text-gray-900 hover:text-[#0b8043] transition line-clamp-2 leading-snug mb-2">
                                                    {product.name}
                                                </h4>
                                            </Link>
                                            <p className="text-[11px] text-gray-400 line-clamp-1 mb-3 flex-1">
                                                {product.description || 'Trái cây tươi ngon tự nhiên'}
                                            </p>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                                                <div>
                                                    <span className="text-sm md:text-base font-black text-red-600 block leading-tight">
                                                        {formatCurrency(product.price)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">Kho: {product.stock}</span>
                                                </div>
                                                <Link
                                                    href={`/shop/products/${prodId}`}
                                                    className="w-8 h-8 rounded-xl bg-green-50 text-[#0b8043] hover:bg-[#0b8043] hover:text-white transition flex items-center justify-center font-bold text-sm"
                                                    title="Xem chi tiết"
                                                >
                                                    +
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
