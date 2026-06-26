'use client';

import { useState, useEffect } from 'react';
import AddonModal from '@/components/AddonModal';
import CartDrawer from '@/components/CartDrawer';
import { formatCurrency } from '@/utils/helpers';
import { Product, Category, CartData, User } from '@/types/shop';
import { getCart } from '@/utils/cart';
import { fetchProducts, fetchCategories } from '@/services/productService';
import { fetchCurrentUser } from '@/services/authService';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // State điều khiển Giỏ hàng & Modal
    const [cartData, setCartData] = useState<CartData>({ items: [], total: 0, discount: 0, payable: 0, totalItems: 0 });
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    useEffect(() => {
        const loadInitialData = async () => {
            const productsData = await fetchProducts(selectedCategoryId);
            setProducts(productsData);

            const categoriesData = await fetchCategories();
            setCategories(categoriesData);

            const userData = await fetchCurrentUser();
            setUser(userData);
        };

        loadInitialData();
        loadCartItems();
    }, [selectedCategoryId]);

    const loadCartItems = () => {
        try {
            const data = getCart();
            setCartData(data);
        } catch (error) {
            console.error('Lỗi khi tải giỏ hàng:', error);
        }
    };

    const handleAddToCartClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-4 flex items-center justify-between py-4">
                    <a className="text-2xl font-bold text-green-600 tracking-tight" href="/shop">FruitShop</a>
                    <nav className="flex items-center gap-6">
                        <a href="/shop" className="text-gray-600 hover:text-green-600 font-medium transition">Trang chủ</a>

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

                        {!user ? (
                            <div className="flex items-center gap-4">
                                <a href="/register" className="text-gray-600 hover:text-green-600 font-medium transition">Đăng ký</a>
                                <a href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">Đăng nhập</a>
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
                                            <li><a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" href="/admin/dashboard">Kênh quản lý</a></li>
                                        )}
                                        <li>
                                            <form action="/login" method="post" className="m-0">
                                                <button type="submit" className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Đăng xuất</button>
                                            </form>
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
                        const imgPath = product.image ? (product.image.startsWith('/') ? product.image : `/images/${product.image}`) : null;
                        return (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" key={prodId}>
                                <div className="h-56 bg-gray-50 flex items-center justify-center p-4">
                                    {imgPath ? <img src={imgPath} alt={product.name} className="max-h-full max-w-full object-contain" /> : <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-2xl uppercase">{product.name?.substring(0, 1)}</div>}
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <p className="text-xs font-semibold text-green-600 uppercase mb-1">{(product.category_id?.name || product.category?.name || 'Trái cây')}</p>
                                    <h5 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h5>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xl font-extrabold text-gray-900">{formatCurrency(product.price)}</span>
                                        <button className="px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200" disabled={product.stock <= 0} onClick={() => handleAddToCartClick(product)}>
                                            {product.stock > 0 ? 'Thêm giỏ' : 'Hết hàng'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <AddonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} onCartUpdated={loadCartItems} />
            <CartDrawer isOpen={isCartOpen} cartData={cartData} user={user} onClose={() => setIsCartOpen(false)} onCartUpdated={loadCartItems} />
        </div>
    );
}