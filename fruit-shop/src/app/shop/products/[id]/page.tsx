'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProductById } from '@/services/productService';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopStore } from '@/store/useShopStore';
import { addToCart } from '@/utils/cart';
import { formatCurrency, getProductImage, showNotification } from '@/utils/helpers';
import { Addon, Product } from '@/types/shop';
import { fetchAddons } from '@/services/addonService';

const isAddonAllowed = (addon: Addon, productCategory: any): boolean => {
    if (!addon.allowed_categories || addon.allowed_categories.length === 0) return true;
    if (!productCategory) return true;
    
    const prodCatId = typeof productCategory === 'object' ? productCategory._id || productCategory.id : productCategory;
    
    return addon.allowed_categories.some((cat: any) => {
        const catId = typeof cat === 'object' ? cat._id || cat.id : cat;
        return String(catId) === String(prodCatId);
    });
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loadUser } = useAuthStore();
    interface LocalAddon extends Addon {
        selected?: boolean;
    }
    const [addons, setAddons] = useState<LocalAddon[]>([]);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(1);
    const [engravingText, setEngravingText] = useState<string>('');
    const [totalPrice, setTotalPrice] = useState<number>(0);

    const addonPrices = { engrave: 50000, peel: 20000, wrap: 15000 };

    useEffect(() => {
        loadUser();
        const loadProduct = async () => {
            if (!params?.id) return;

            // 1. Tìm sản phẩm trong cache của Zustand Shop Store để hiển thị ngay lập tức (0ms)
            const cachedProduct = useShopStore.getState().products.find(p => String(p._id || p.id) === String(params.id));
            if (cachedProduct) {
                setProduct(cachedProduct);
                setTotalPrice(Number(cachedProduct.price));
                setLoading(false);
            }

            // 2. Gọi API để cập nhật dữ liệu mới nhất (giá cả, tồn kho thực tế) ở background
            try {
                const data = await fetchProductById(String(params.id));
                if (data) {
                    setProduct(data);
                    setTotalPrice(Number(data.price));
                    setLoading(false);
                } else if (!cachedProduct) {
                    alert('Không tìm thấy sản phẩm này!');
                    router.push('/shop');
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin sản phẩm chi tiết:", err);
                if (!cachedProduct) {
                    router.push('/shop');
                }
            }
        };
        loadProduct();
    }, [params?.id]);

    const loadAddons = async () => {
        setLoading(true);
        try {
            const data = await fetchAddons();
            // Lọc các dịch vụ khả dụng từ DB và khởi tạo trạng thái selected = false
            const availableAddons = data
                .filter((a: Addon) => a.active)
                .map((a: Addon) => ({ ...a, selected: false }));
            setAddons(availableAddons);
        } catch (err: any) {
            console.error("Lỗi khi tải danh sách dịch vụ thêm:", err);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadAddons();
    }, []);

    useEffect(() => {
        if (!product) return;
        let base = Number(product.price);
        addons.forEach(addon => {
            if (addon.selected) {
                base += addon.price;
            }
        });
        setTotalPrice(base);
    }, [addons, product]);

    const handleCheckboxChange = (id: string) => {
        setAddons(prev => prev.map(addon =>
            addon._id === id ? { ...addon, selected: !addon.selected } : addon
        ));
    };

    const getSelectedAddonsList = () => {
        const list: { name: string; price: number }[] = [];
        addons.forEach(addon => {
            if (addon.selected && isAddonAllowed(addon, product?.category_id)) {
                list.push({ name: addon.name, price: addon.price });
            }
        });
        return list;
    };

    const handleAddToCart = () => {
        if (!product) return;
        const addonsList = getSelectedAddonsList();
        addToCart(product, quantity, addonsList, user?.name);
        showNotification('Đã thêm vào giỏ hàng thành công!');
    };

    const handleBuyNow = () => {
        if (!product) return;
        if (!user || !user.customerId) {
            alert('Vui lòng đăng nhập trước khi thanh toán!');
            router.push('/login');
            return;
        }
        const addonsList = getSelectedAddonsList();
        addToCart(product, quantity, addonsList, user?.name);
        router.push('/shop/checkout');
    };

    if (loading || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải chi tiết sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back Button & Breadcrumbs */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-1.5 transition focus:outline-none"
                    >
                        <span>&larr;</span> Quay lại
                    </button>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/shop" className="hover:text-green-600 transition">Cửa hàng</Link>
                        <span>/</span>
                        <span className="text-gray-400 max-w-[150px] md:max-w-xs truncate">{product.name}</span>
                    </div>
                </div>

                {/* Details Container */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                    {/* Left Column: Image */}
                    <div className="flex items-center justify-center bg-gray-50 rounded-2xl min-h-[300px] md:min-h-[450px] overflow-hidden">
                        <img
                            src={getProductImage(product.image)}
                            alt={product.name}
                            className="w-full h-full min-h-[300px] md:min-h-[450px] object-cover hover:scale-105 transition duration-300"
                        />
                    </div>

                    {/* Right Column: Info & Options */}
                    <div className="flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                                {product.category_id?.name || 'Trái cây tươi'}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl md:text-3xl font-black text-red-600">
                                    {formatCurrency(totalPrice)}
                                </span>
                                {totalPrice !== product.price && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatCurrency(product.price)}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                            </p>
                        </div>

                        {/* Custom Addons / Services Selection */}
                        {product && addons.length > 0 && (
                            (() => {
                                const allowedAddons = addons.filter(addon => isAddonAllowed(addon, product.category_id));
                                
                                if (allowedAddons.length === 0) return null;
                                
                                return (
                                    <div className="border-t border-b py-5 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Dịch vụ đi kèm tùy chọn:</h3>
                                        <div className="">
                                            {allowedAddons.map((addon, index) => (
                                                <div
                                                    key={addon._id || index}
                                                    onClick={() => handleCheckboxChange(String(addon._id))}
                                                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition select-none mb-3 last:mb-0 ${addon.selected ? 'border-green-600 bg-green-50/40 text-green-950 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-white text-xs ${addon.selected ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}>
                                                            {addon.selected && '✓'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{addon.name}</p>
                                                            <p className="text-xs opacity-75">{addon.description}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-semibold">+{formatCurrency(addon.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        {/* Quantity Selector & Checkout Buttons */}
                        {user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER' ? (
                            <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl border border-amber-100/70 text-xs font-bold text-center leading-relaxed animate-fadeIn">
                                🔒 Tài khoản quản lý / quản trị viên chỉ có quyền xem thông tin chi tiết sản phẩm, không hỗ trợ chức năng mua hàng tại đây.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-700">Số lượng mua:</span>
                                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                                        <button
                                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                            className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-800 hover:text-green-600 hover:bg-white rounded-lg transition cursor-pointer select-none"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity === 0 ? '' : quantity}
                                            min={1}
                                            max={product.stock}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (isNaN(val)) {
                                                    setQuantity(0);
                                                } else {
                                                    setQuantity(Math.min(product.stock, Math.max(1, val)));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (quantity < 1) {
                                                    setQuantity(1);
                                                }
                                            }}
                                            className="w-12 text-center text-sm font-extrabold text-gray-900 bg-transparent outline-none focus:outline-none border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                                            disabled={quantity >= product.stock}
                                            className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-800 hover:text-green-600 hover:bg-white rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer select-none"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-right text-gray-400">
                                    Kho còn lại: <strong className="text-gray-600">{product.stock}</strong> sản phẩm
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleAddToCart}
                                        className="py-3.5 border border-green-600 text-green-600 font-bold rounded-xl hover:bg-green-50 transition active:scale-[0.99] uppercase text-xs tracking-wider"
                                    >
                                        Thêm vào giỏ
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition active:scale-[0.99] uppercase text-xs tracking-wider shadow-md shadow-green-600/10"
                                    >
                                        Mua ngay
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
