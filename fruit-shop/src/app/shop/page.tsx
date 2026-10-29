'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { formatCurrency, getProductImage, isTokenExpired } from '@/utils/helpers';
import { Product, Category } from '@/types/shop';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopStore } from '@/store/useShopStore';

export default function ShopPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { products, categories, selectedCategoryId, setSelectedCategoryId, loadShopData } = useShopStore();
    const { user, loadUser, logout, hasHydrated } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
    const itemsPerPage = 8;

    // Carousel ref cho khối Icon tròn danh mục nổi bật
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    // Đọc search param từ URL và gọi API Backend tìm kiếm
    useEffect(() => {
        const queryFromUrl = searchParams.get('search') ?? '';
        setSearchQuery(queryFromUrl);
        loadShopData(selectedCategoryId, true, false, queryFromUrl);
    }, [searchParams, selectedCategoryId, loadShopData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategoryId, searchQuery, priceSort]);

    useEffect(() => {
        setMounted(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem("fruit_shop_token") : null;
        if (token) {
            loadUser().finally(() => setAuthChecked(true));
        } else {
            setAuthChecked(true);
        }
        loadShopData(selectedCategoryId, true, true);

        // Kiểm tra token định kỳ
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem("fruit_shop_token");
            if (currentToken && isTokenExpired(currentToken)) {
                logout();
                router.push('/login');
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [loadUser, loadShopData, logout, router, selectedCategoryId]);

    // Cuộn ngang khối Icon tròn Danh mục
    const scrollCategory = (direction: 'left' | 'right') => {
        if (categoryScrollRef.current) {
            const scrollAmount = direction === 'left' ? -240 : 240;
            categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // TẦNG 2: Lọc các Kệ hàng chủ lực (Featured Categories)
    // Ưu tiên các category có isFeatured = true, nếu database chưa cập nhật thì fallback lấy 3-4 danh mục đầu
    const featuredCategories = categories.filter(c => c.isFeatured === true);
    const displayShelves = featuredCategories.length > 0 ? featuredCategories.slice(0, 4) : categories.slice(0, 4);

    // Lấy sản phẩm cho từng kệ hàng chủ lực
    const getProductsForCategory = (catId?: string | number) => {
        if (!catId) return [];
        return products.filter(p => {
            const pCatId = typeof p.category_id === 'object' ? p.category_id?._id || p.category_id?.id : p.category_id;
            return String(pCatId) === String(catId);
        }).slice(0, 4);
    };

    // Danh sách sản phẩm khi đang tìm kiếm
    let searchProductsList = [...products];
    if (priceSort === 'asc') {
        searchProductsList.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
        searchProductsList.sort((a, b) => b.price - a.price);
    }
    const totalPages = Math.ceil(searchProductsList.length / itemsPerPage);
    const paginatedSearchProducts = searchProductsList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="min-h-screen bg-[#f8faf9] text-gray-800 font-sans flex flex-col">
            {/* TẦNG 1: HEADER (Chứa Topbar, Search, và Menu "Sản phẩm ▾" xổ xuống 100% tất cả danh mục) */}
            <Header
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {/* NẾU ĐANG TÌM KIẾM THEO TỪ KHÓA -> ẨN BANNER & KỆ HÀNG, HIỆN KẾT QUẢ TÌM KIẾM */}
            {searchQuery.trim() ? (
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">
                                    Kết quả tìm kiếm cho: <span className="text-[#0b8043]">"{searchQuery}"</span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Tìm thấy {searchProductsList.length} sản phẩm phù hợp</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-500">Lọc giá:</span>
                                <select
                                    value={priceSort}
                                    onChange={(e) => setPriceSort(e.target.value as any)}
                                    className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 py-1.5 px-3 rounded-xl focus:outline-none"
                                >
                                    <option value="default">Mặc định</option>
                                    <option value="asc">Giá: Thấp &rarr; Cao</option>
                                    <option value="desc">Giá: Cao &rarr; Thấp</option>
                                </select>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        router.push('/shop');
                                    }}
                                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                                >
                                    ✕ Xóa tìm kiếm
                                </button>
                            </div>
                        </div>

                        {/* Search product grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                            {paginatedSearchProducts.map(product => {
                                const prodId = product._id || product.id;
                                return (
                                    <div key={prodId} className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 flex flex-col hover:shadow-md transition">
                                        <Link href={`/shop/products/${prodId}`} className="h-40 flex items-center justify-center p-2 mb-2">
                                            <img src={getProductImage(product.image)} alt={product.name} className="max-h-full max-w-full object-contain" />
                                        </Link>
                                        <p className="text-[10px] font-bold text-[#0b8043] uppercase mb-1">{product.category_id?.name || 'Trái cây'}</p>
                                        <Link href={`/shop/products/${prodId}`}>
                                            <h4 className="text-xs md:text-sm font-bold text-gray-900 hover:text-[#0b8043] line-clamp-2 mb-2">{product.name}</h4>
                                        </Link>
                                        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                                            <span className="text-sm md:text-base font-black text-red-600">{formatCurrency(product.price)}</span>
                                            <Link href={`/shop/products/${prodId}`} className="w-8 h-8 rounded-xl bg-green-50 text-[#0b8043] hover:bg-[#0b8043] hover:text-white transition flex items-center justify-center font-bold text-sm">+</Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            ) : (
                /* GIAO DIỆN CHÍNH TRANG CHỦ THEO MẪU ẢNH THIẾT KẾ */
                <main className="flex-1 pb-16">
                    {/* HERO SLIDER & SIDE BANNERS */}
                    <section className="container mx-auto px-4 pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Main Big Banner */}
                            <div className="lg:col-span-8 rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#0b8043] to-[#15803d] text-white p-8 md:p-12 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-sm">
                                <div className="max-w-md z-10">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs text-[11px] font-bold rounded-full uppercase tracking-wider mb-3">
                                        Trái Cây Tươi Hữu Cơ 100%
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-3">
                                        Chọn trái cây ngon, giao nhanh trong ngày
                                    </h1>
                                    <p className="text-white/80 text-xs md:text-sm leading-relaxed mb-6">
                                        FruitShop mang đến nguồn hoa quả sạch, mọng nước, chuẩn VietGAP & GlobalGAP từ nông trại đến bàn ăn gia đình bạn.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <a href="#featured-shelves" className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-md transition">
                                            Bắt đầu mua sắm &rarr;
                                        </a>
                                        <Link href="/shop/category/all" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-xs transition">
                                            Khám phá danh mục
                                        </Link>
                                    </div>
                                </div>
                                {/* Background Decorative Fruit Images */}
                                <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-25 lg:opacity-85 pointer-events-none flex items-center justify-end pr-4">
                                    <img src="/images/MC.png" alt="Banner fruit" className="max-h-full object-contain" />
                                </div>
                            </div>

                            {/* 2 Side Promotion Banners */}
                            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
                                <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-3xl p-5 flex items-center justify-between shadow-2xs hover:shadow-sm transition">
                                    <div>
                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full uppercase">Mới ra mắt</span>
                                        <h3 className="text-sm font-extrabold text-gray-900 mt-1">Nước ép Detox Cần Tây</h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Giảm cân, thanh lọc cơ thể</p>
                                        <Link href="/shop" className="text-xs font-bold text-[#0b8043] inline-flex items-center gap-1 mt-2 hover:underline">
                                            Mua ngay <span>&rarr;</span>
                                        </Link>
                                    </div>
                                    <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-2xs flex-shrink-0 flex items-center justify-center">
                                        <img src="/images/1783084153515-nuocepcantay.jpg" alt="Juice" className="max-h-full object-contain" />
                                    </div>
                                </div>

                                <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-5 flex items-center justify-between shadow-2xs hover:shadow-sm transition">
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full uppercase">Quà biếu sang</span>
                                        <h3 className="text-sm font-extrabold text-gray-900 mt-1">Hộp Quà Trái Cây Tết</h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Ưu đãi giảm 20% đặt sớm</p>
                                        <Link href="/shop" className="text-xs font-bold text-[#0b8043] inline-flex items-center gap-1 mt-2 hover:underline">
                                            Xem mẫu <span>&rarr;</span>
                                        </Link>
                                    </div>
                                    <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-2xs flex-shrink-0 flex items-center justify-center">
                                        <img src="/images/1782847013695-hoptao.jpg" alt="Box" className="max-h-full object-contain" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4 Feature Badges */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {[
                                { icon: '🛡️', title: '100% Chuẩn VietGAP', desc: 'Nguồn gốc rõ ràng' },
                                { icon: '⚡', title: 'Giao nhanh trong 2H', desc: 'Đảm bảo quả tươi giòn' },
                                { icon: '🔄', title: 'Đổi trả miễn phí', desc: 'Trong vòng 24 giờ' },
                                { icon: '🎁', title: 'Ưu đãi thành viên', desc: 'Tích điểm đổi quà tặng' }
                            ].map((f, i) => (
                                <div key={i} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-center gap-3">
                                    <span className="text-2xl">{f.icon}</span>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">{f.title}</h4>
                                        <p className="text-[10px] text-gray-400">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* TẦNG 1 (tiếp theo): KHỐI ICON TRÒN DANH MỤC NỔI BẬT (Carousel + Xem tất cả) */}
                    <section className="container mx-auto px-4 mt-10">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🌟</span>
                                    <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                                        Danh Mục Nổi Bật
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Mũi tên trượt ngang Carousel */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => scrollCategory('left')}
                                            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition shadow-2xs cursor-pointer"
                                            title="Trượt sang trái"
                                        >
                                            &larr;
                                        </button>
                                        <button
                                            onClick={() => scrollCategory('right')}
                                            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition shadow-2xs cursor-pointer"
                                            title="Trượt sang phải"
                                        >
                                            &rarr;
                                        </button>
                                    </div>

                                    {/* Nút Xem tất cả > chuyển sang trang danh mục */}
                                    <Link
                                        href="/shop/category/all"
                                        className="text-xs font-bold text-[#0b8043] hover:text-[#096d39] flex items-center gap-1 ml-2"
                                    >
                                        Xem tất cả &gt;
                                    </Link>
                                </div>
                            </div>

                            {/* Carousel Icon tròn 8 - 10 danh mục */}
                            <div
                                ref={categoryScrollRef}
                                className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {categories.map((cat, idx) => {
                                    const catId = cat._id || cat.id;
                                    const colors = [
                                        'bg-orange-50 border-orange-200 text-orange-600',
                                        'bg-emerald-50 border-emerald-200 text-emerald-600',
                                        'bg-rose-50 border-rose-200 text-rose-600',
                                        'bg-amber-50 border-amber-200 text-amber-600',
                                        'bg-teal-50 border-teal-200 text-teal-600',
                                        'bg-purple-50 border-purple-200 text-purple-600',
                                        'bg-blue-50 border-blue-200 text-blue-600'
                                    ];
                                    const colorStyle = colors[idx % colors.length];

                                    return (
                                        <Link
                                            key={catId}
                                            href={`/shop/category/${catId}`}
                                            className="flex flex-col items-center gap-2 group flex-shrink-0 w-24 text-center cursor-pointer"
                                        >
                                            <div className={`w-18 h-18 rounded-full ${colorStyle} border flex items-center justify-center text-2xl shadow-2xs group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                                                <span>{cat.icon || '🍇'}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-800 group-hover:text-[#0b8043] transition line-clamp-1 leading-tight">
                                                {cat.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* FLASH SALE KHUNG ĐẶC BIỆT */}
                    <section className="container mx-auto px-4 mt-10">
                        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 rounded-3xl p-6 text-white shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl animate-bounce">⚡</span>
                                    <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">FLASH SALE GIÁ SỐC HÔM NAY</h2>
                                    <span className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-bold">Kết thúc sau: 05:24:18</span>
                                </div>
                                <Link href="/shop" className="text-xs font-bold text-white/90 hover:text-white flex items-center gap-1 self-start md:self-auto">
                                    Xem tất cả deal hot &gt;
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {products.slice(0, 4).map((p, idx) => {
                                    const pId = p._id || p.id;
                                    return (
                                        <div key={pId} className="bg-white rounded-2xl p-3.5 text-gray-900 shadow-sm flex flex-col group hover:shadow-md transition">
                                            <div className="relative h-36 bg-gray-50 rounded-xl p-2 mb-2 flex items-center justify-center overflow-hidden">
                                                <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-md">
                                                    -{20 + idx * 5}%
                                                </span>
                                                <img src={getProductImage(p.image)} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition" />
                                            </div>
                                            <h4 className="text-xs font-bold text-gray-900 truncate mb-1">{p.name}</h4>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-sm font-black text-red-600">{formatCurrency(p.price)}</span>
                                                <span className="text-[10px] text-gray-400 line-through">{formatCurrency(p.price * 1.25)}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                                                <div className="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full" style={{ width: `${75 - idx * 12}%` }}></div>
                                            </div>
                                            <Link href={`/shop/products/${pId}`} className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-xl text-center transition mt-auto">
                                                Mua ngay
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* TẦNG 2: CÁC "KỆ HÀNG" TRƯNG BÀY SẢN PHẨM CHỦ LỰC (FEATURED CATEGORIES) */}
                    <div id="featured-shelves" className="space-y-10 mt-10">
                        {displayShelves.map((shelfCat, shelfIdx) => {
                            const shelfCatId = shelfCat._id || shelfCat.id;
                            const shelfProducts = getProductsForCategory(shelfCatId);

                            return (
                                <section key={shelfCatId} className="container mx-auto px-4">
                                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-2xs">
                                        {/* Shelf Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-green-50 text-[#0b8043] flex items-center justify-center text-xl font-bold">
                                                    {shelfCat.icon || (shelfIdx === 0 ? '🍹' : shelfIdx === 1 ? '🍎' : shelfIdx === 2 ? '🎁' : '🍊')}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                                        <span>{shelfCat.name}</span>
                                                        <span className="text-[10px] font-bold text-[#0b8043] bg-green-50 px-2 py-0.5 rounded-full uppercase">
                                                            Chủ lực
                                                        </span>
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {shelfCat.description || 'Các sản phẩm chất lượng cao được ưa chuộng nhất'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* TẦNG 3: Bấm Xem tất cả để sang trang riêng /shop/category/[id] */}
                                            <Link
                                                href={`/shop/category/${shelfCatId}`}
                                                className="text-xs font-bold text-[#0b8043] hover:text-[#096d39] flex items-center gap-1 self-start sm:self-auto bg-green-50/60 hover:bg-green-50 px-3.5 py-1.5 rounded-xl transition"
                                            >
                                                <span>Xem thêm {shelfCat.name}</span>
                                                <span>&rarr;</span>
                                            </Link>
                                        </div>

                                        {/* Shelf Products Grid (Tối đa 4 sản phẩm mẫu) */}
                                        {shelfProducts.length === 0 ? (
                                            <div className="py-8 text-center text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-gray-100/60">
                                                Đang cập nhật sản phẩm cho kệ hàng này...
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                                                {shelfProducts.map(p => {
                                                    const pId = p._id || p.id;
                                                    return (
                                                        <div
                                                            key={pId}
                                                            className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group p-3.5"
                                                        >
                                                            <Link href={`/shop/products/${pId}`} className="h-44 bg-gray-50/60 rounded-xl p-2 flex items-center justify-center overflow-hidden mb-3">
                                                                <img
                                                                    src={getProductImage(p.image)}
                                                                    alt={p.name}
                                                                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                                                                />
                                                            </Link>
                                                            <span className="text-[10px] font-bold text-[#0b8043] uppercase mb-1">
                                                                {shelfCat.name}
                                                            </span>
                                                            <Link href={`/shop/products/${pId}`}>
                                                                <h4 className="text-xs md:text-sm font-bold text-gray-900 hover:text-[#0b8043] transition line-clamp-2 leading-snug mb-1">
                                                                    {p.name}
                                                                </h4>
                                                            </Link>
                                                            <p className="text-[11px] text-gray-400 line-clamp-1 mb-3">
                                                                {p.description || 'Trái cây tươi ngon chuẩn hữu cơ'}
                                                            </p>
                                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                                                                <div>
                                                                    <span className="text-sm md:text-base font-black text-red-600 block">
                                                                        {formatCurrency(p.price)}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400">Kho: {p.stock}</span>
                                                                </div>
                                                                <Link
                                                                    href={`/shop/products/${pId}`}
                                                                    className="w-8 h-8 rounded-xl bg-green-50 text-[#0b8043] hover:bg-[#0b8043] hover:text-white transition flex items-center justify-center font-bold text-sm"
                                                                    title="Xem chi tiết"
                                                                >
                                                                    +
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    {/* GIỚI THIỆU THƯƠNG HIỆU & FOOTER TRONG HÌNH ẢNH MẪU */}
                    <section className="container mx-auto px-4 mt-12">
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-2xs">
                            <h3 className="text-lg font-black text-gray-900 mb-2">FruitShop - Nông Trại Hữu Cơ & Hoa Quả Sạch Hàng Đầu</h3>
                            <p className="text-xs text-gray-500 leading-relaxed mb-6">
                                FruitShop tự hào là đơn vị cung ứng hoa quả sạch, trái cây nhập khẩu và nông sản nội địa chuẩn VietGAP, GlobalGAP. Mỗi trái cây đều trải qua quy trình kiểm soát nghiêm ngặt, giữ trọn hương vị tự nhiên và độ tươi mới mỗi ngày.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100 text-center">
                                <div>
                                    <p className="text-2xl font-black text-[#0b8043]">50.000+</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Khách hàng tin tưởng</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#0b8043]">100%</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Chuẩn VietGAP & GlobalGAP</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#0b8043]">2 Giờ</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Giao hỏa tốc nội thành</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#0b8043]">4.9 / 5 ⭐</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Đánh giá hài lòng</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            )}

            {/* FOOTER */}
            <footer className="bg-white border-t border-gray-100 mt-auto pt-10 pb-6 text-xs text-gray-600">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0b8043] flex items-center justify-center text-white font-bold">🍎</div>
                            <span className="text-base font-black text-[#0b8043]">FruitShop</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-[11px]">
                            Hệ thống trái cây tươi và quà tặng hữu cơ cao cấp, cam kết chất lượng tươi ngon hàng ngày.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider">Chăm sóc khách hàng</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li><Link href="/shop" className="hover:text-[#0b8043]">Hướng dẫn mua hàng</Link></li>
                            <li><Link href="/shop" className="hover:text-[#0b8043]">Chính sách giao hàng</Link></li>
                            <li><Link href="/shop" className="hover:text-[#0b8043]">Chính sách đổi trả 24h</Link></li>
                            <li><Link href="/shop" className="hover:text-[#0b8043]">Cam kết chất lượng</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider">Hình thức thanh toán</h4>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-semibold">
                            <span className="px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">COD Tiền mặt</span>
                            <span className="px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">VietQR</span>
                            <span className="px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">MB Bank</span>
                            <span className="px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">ATM / Visa</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider">Đăng ký nhận khuyến mãi</h4>
                        <p className="text-[11px] text-gray-400 mb-2">Nhận voucher giảm giá 10% cho đơn hàng đầu tiên.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email của bạn..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#0b8043]" />
                            <button className="px-3.5 py-2 bg-[#0b8043] text-white font-bold rounded-xl text-xs hover:bg-[#096d39]">Gửi</button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 pt-6 border-t border-gray-50 text-center text-gray-400 text-[11px]">
                    &copy; {new Date().getFullYear()} FruitShop - Nông Trại Hữu Cơ. All rights reserved.
                </div>
            </footer>
        </div>
    );
}