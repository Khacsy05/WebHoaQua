'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartDrawer from '@/components/CartDrawer';
import { formatCurrency, getProductImage } from '@/utils/helpers';
import { Product, Category, CartData } from '@/types/shop';
import { getCart } from '@/utils/cart';
import { fetchProducts, fetchCategories } from '@/services/productService';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopStore } from '@/store/useShopStore';

export default function ShopPage() {
    const { products, categories, selectedCategoryId, setSelectedCategoryId, loadShopData } = useShopStore();
    const { user, loadUser, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    // State điều khiển Giỏ hàng
    const [cartData, setCartData] = useState<CartData>({ items: [], total: 0, discount: 0, payable: 0, totalItems: 0 });
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
        loadUser();
        loadShopData(selectedCategoryId);
    }, []);

    useEffect(() => {
        loadCartItems();
    }, [user]);

    const loadCartItems = () => {
        try {
            const data = getCart(user?.name);
            setCartData(data);
        } catch (error) {
            console.error('Lỗi khi tải giỏ hàng:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-4 flex items-center justify-between py-4">
                    <Link className="text-2xl font-bold text-green-600 tracking-tight" href="/shop">FruitShop</Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/shop" className="text-gray-600 hover:text-green-600 font-medium transition">Trang chủ</Link>

                        <button
                            className="relative text-gray-700 hover:text-green-600 p-1 transition focus:outline-none"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            {cartData.totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {cartData.totalItems}
                                </span>
                            )}
                        </button>

                        {!mounted ? (
                            <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse"></div>
                        ) : !user ? (
                            <div className="flex items-center gap-4">
                                <Link href="/register" className="text-gray-600 hover:text-green-600 font-medium transition">Đăng ký</Link>
                                <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">Đăng nhập</Link>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    className="border border-green-600 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-1 transition focus:outline-none"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    Chào, {user.name}
                                    <span className="text-[10px]">▼</span>
                                </button>
                                {isDropdownOpen && (
                                    <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-fadeIn">
                                        {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER') && (
                                            <li><Link className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" href="/admin/dashboard">Kênh quản lý</Link></li>
                                        )}
                                        <li>
                                            <button
                                                onClick={() => { logout(); setIsDropdownOpen(false); }}
                                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                                            >
                                                Đăng xuất
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            {/* HERO */}
            <section className="relative py-20 bg-cover bg-right md:bg-center" style={{ backgroundImage: `linear-gradient(to right, #f4fbf6 35%, rgba(244, 251, 246, 0.8) 55%, rgba(244, 251, 246, 0) 100%), url('/images/MC.png')` }}>
                <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 items-center">
                    <div className="py-4 max-w-xl">
                        <p className="text-green-600 font-semibold uppercase tracking-wider text-sm mb-2">Trái cây tươi mỗi ngày</p>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Chọn trái cây ngon, giao nhanh trong ngày</h1>
                        <p className="text-gray-600 text-lg mt-4 leading-relaxed">FruitShop mang đến giỏ trái cây sạch, ngọt tự nhiên và ưu đãi.</p>
                        <div className="flex gap-4 flex-wrap mt-8">
                            {!user && <a className="border border-green-600 text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition" href="/login">Đăng nhập mua hàng</a>}
                            <a className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 shadow-md shadow-green-200 transition" href="#products">Bắt đầu mua sắm</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section id="products" className="container mx-auto px-4 mt-12">
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                    <button className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategoryId === null ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => setSelectedCategoryId(null)}>Tất cả</button>
                    {categories.map(category => {
                        const catId = category._id || category.id;
                        return (
                            <button key={catId} className={`px-4 py-2 rounded-full text-sm font-medium transition ${catId === selectedCategoryId ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => setSelectedCategoryId(catId || null)}>{category.name}</button>
                        );
                    })}
                </div>
            </section>

            {/* PRODUCTS */}
            <section className="container mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {products.map(product => {
                        const prodId = product._id || product.id;
                        const imgPath = getProductImage(product.image);
                        return (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition duration-300" key={prodId}>
                                <Link href={`/shop/products/${prodId}`} className="block">
                                    <div className="h-56 bg-gray-50 flex items-center justify-center p-4">
                                        <img src={imgPath} alt={product.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                </Link>
                                <div className="p-5 flex flex-col flex-grow">
                                    <p className="text-xs font-semibold text-green-600 uppercase mb-1">{(product.category_id?.name || product.category?.name || 'Trái cây')}</p>
                                    <Link href={`/shop/products/${prodId}`}>
                                        <h5 className="text-lg font-bold text-gray-900 mb-2 hover:text-green-600 transition">{product.name}</h5>
                                    </Link>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xl font-extrabold text-gray-900">{formatCurrency(product.price)}</span>
                                        <Link href={`/shop/products/${prodId}`} className="px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700">
                                            Xem chi tiết
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <CartDrawer isOpen={isCartOpen} cartData={cartData} user={user} onClose={() => setIsCartOpen(false)} onCartUpdated={loadCartItems} />
        </div>
    );
}