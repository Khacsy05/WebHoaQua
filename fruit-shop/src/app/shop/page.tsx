'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartDrawer from '@/components/CartDrawer';
import { formatCurrency, getProductImage, isTokenExpired } from '@/utils/helpers';
import { Product, Category, CartData } from '@/types/shop';
import { getCart } from '@/utils/cart';
import { fetchProducts, fetchCategories } from '@/services/productService';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopStore } from '@/store/useShopStore';
import { updateCurrentUser } from '@/services/authService';

export default function ShopPage() {
    const router = useRouter();
    const { products, categories, selectedCategoryId, setSelectedCategoryId, loadShopData } = useShopStore();
    const { user, loadUser, logout, setUser, hasHydrated } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    console.log("ShopPage Render:", {
        mounted,
        authChecked,
        hasHydrated,
        user: user ? { name: user.name, customerName: user.customer?.name } : null,
        hasToken: typeof window !== 'undefined' ? !!localStorage.getItem("fruit_shop_token") : false
    });

    // State điều khiển Giỏ hàng
    const [cartData, setCartData] = useState<CartData>({ items: [], total: 0, discount: 0, payable: 0, totalItems: 0 });
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState<boolean>(false);

    // State cho Hồ sơ cá nhân
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    useEffect(() => {
        setMounted(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem("fruit_shop_token") : null;
        if (token) {
            loadUser()
                .finally(() => setAuthChecked(true));
        } else {
            setAuthChecked(true);
        }
        loadShopData(selectedCategoryId, true, true);

        // Định kỳ kiểm tra token hết hạn sau mỗi 10 giây
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem("fruit_shop_token");
            if (currentToken && isTokenExpired(currentToken)) {
                logout();
                router.push('/login');
            }
        }, 10000);

        return () => clearInterval(interval);
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

    const openProfileModal = () => {
        if (user) {
            setProfileForm({
                name: user.customer?.name || user.name || '',
                phone: user.customer?.phone || '',
                address: user.customer?.address || ''
            });
            setProfileError('');
            setProfileSuccess('');
            setIsProfileOpen(true);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError('');
        setProfileSuccess('');
        try {
            const res = await updateCurrentUser(profileForm);
            if (res.success) {
                setProfileSuccess('Cập nhật thông tin thành công!');
                setUser(res.data);
                setTimeout(() => {
                    setIsProfileOpen(false);
                }, 1500);
            } else {
                setProfileError(res.message || 'Có lỗi xảy ra');
            }
        } catch (err: any) {
            setProfileError(err.message || 'Lỗi mạng');
        } finally {
            setProfileLoading(false);
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

                        {!mounted || !hasHydrated || (!authChecked && !user) ? (
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
                                    Chào, {user.customer?.name || user.name}
                                    <span className="text-[10px]">▼</span>
                                </button>
                                {isDropdownOpen && (
                                    <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-fadeIn">
                                        {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER') && (
                                            <li><Link className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" href="/admin/dashboard">Kênh quản lý</Link></li>
                                        )}
                                        <li>
                                            <button
                                                onClick={() => { openProfileModal(); setIsDropdownOpen(false); }}
                                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                                            >
                                                Thông tin tài khoản
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => {
                                                    router.push('/login');
                                                    setIsDropdownOpen(false);
                                                }}
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
                            {mounted && hasHydrated && authChecked && !user && <a className="border border-green-600 text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition" href="/login">Đăng nhập mua hàng</a>}
                            <a className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 shadow-md shadow-green-200 transition" href="#products">Bắt đầu mua sắm</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section id="products" className="container mx-auto px-4 mt-12">
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 items-center">
                    <button 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategoryId === null ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`} 
                        onClick={() => setSelectedCategoryId(null)}
                    >
                        Tất cả
                    </button>
                    {(isCategoriesExpanded ? categories : categories.slice(0, 7)).map(category => {
                        const catId = category._id || category.id;
                        return (
                            <button 
                                key={catId} 
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${catId === selectedCategoryId ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`} 
                                onClick={() => setSelectedCategoryId(catId || null)}
                            >
                                {category.name}
                            </button>
                        );
                    })}
                    {categories.length > 7 && (
                        <button
                            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                            className="px-4 py-2 rounded-full text-sm font-bold text-green-600 border border-green-200 hover:bg-green-50 transition cursor-pointer"
                        >
                            {isCategoriesExpanded ? 'Thu gọn ▴' : 'Xem thêm ▾'}
                        </button>
                    )}
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

            {/* PROFILE MODAL */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden">
                        {/* Accent top bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Thông tin tài khoản</h3>
                            <button
                                onClick={() => setIsProfileOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {profileError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                                {profileError}
                            </div>
                        )}

                        {profileSuccess && (
                            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl font-medium">
                                {profileSuccess}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Họ và tên</label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                                <input
                                    type="email"
                                    disabled
                                    value={user?.customer?.email || (user?.name ? `${user.name}@gmail.com` : '')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 transition text-sm cursor-not-allowed"
                                />
                                <span className="text-[10px] text-gray-400 mt-1 block">Email đăng ký không thể thay đổi</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Địa chỉ nhận hàng</label>
                                <textarea
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition text-sm text-gray-900 min-h-[80px] resize-none"
                                    placeholder="Nhập địa chỉ của bạn"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition focus:outline-none"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={profileLoading}
                                    className="w-1/2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50 shadow-md shadow-green-100 focus:outline-none"
                                >
                                    {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}