'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchPromotions } from '@/services/promotionService';
import { createOrder } from '@/services/orderService';
import { getCart, clearCart } from '@/utils/cart';
import { formatCurrency, getProductImage } from '@/utils/helpers';
import { CartData, Promotion } from '@/types/shop';

export default function CheckoutPage() {
    const { user, loadUser } = useAuthStore();
    const router = useRouter();
    const [cartData, setCartData] = useState<CartData>({ items: [], total: 0, discount: 0, payable: 0, totalItems: 0 });
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Form states
    const [address, setAddress] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('COD');

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await loadUser();
                if (!userData) {
                    alert('Vui lòng đăng nhập trước khi thanh toán!');
                    window.location.href = '/login';
                    return;
                }

                // Load cart items for this logged-in user
                const cart = getCart(userData.name);
                setCartData(cart);

                if (cart.items.length === 0) {
                    alert('Giỏ hàng của bạn đang trống!');
                    window.location.href = '/shop';
                    return;
                }

                // Prefill user profile details
                if (userData.customer) {
                    setAddress(userData.customer.address || '');
                    setPhone(userData.customer.phone || '');
                }

                // Load active promotions
                const promos = await fetchPromotions();
                setPromotions(promos);
            } catch (error) {
                console.error('Lỗi khi tải trang thanh toán:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const isEligibleForPromotion = selectedPromotion && cartData.total >= selectedPromotion.threshold_amount;
    const activeDiscount = isEligibleForPromotion
        ? Math.round(cartData.total * (selectedPromotion.discount_percent / 100))
        : 0;
    const activePayable = cartData.total - activeDiscount;

    const handleConfirmOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.customerId) return;

        if (!address.trim()) {
            alert('Vui lòng nhập địa chỉ giao hàng!');
            return;
        }
        if (!phone.trim()) {
            alert('Vui lòng nhập số điện thoại!');
            return;
        }

        setIsSubmitting(true);

        const orderItems = cartData.items.map(item => ({
            product_id: String(item._id || item.id),
            quantity: item.quantity,
            addons: item.addons?.join(', ') || null
        }));

        // Call order API
        const result = await createOrder({
            customer_id: user.customerId,
            items: orderItems,
            promotion_id: isEligibleForPromotion ? selectedPromotion?._id : null,
            // Also send updated details
            address,
            phone,
            payment_method: paymentMethod
        });

        if (result.success) {
            alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
            clearCart(user.name);
            router.push('/shop');
        } else {
            alert(result.message || result.error || 'Có lỗi xảy ra khi tạo đơn hàng.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải thông tin thanh toán...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header Back Button */}
                <div className="mb-8 flex items-center justify-between">
                    <Link href="/shop" className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition">
                        <span>&larr;</span> Quay lại Cửa hàng
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thanh toán đơn hàng</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Form: Delivery & Payment Details */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-3">Thông tin giao hàng & Thanh toán</h2>

                        <form onSubmit={handleConfirmOrder} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên khách hàng</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm border border-gray-200 outline-none"
                                    value={user?.customer?.name || user?.name || ''}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm border border-gray-200 outline-none"
                                    value={user?.customer?.email || ''}
                                    disabled
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="phone"
                                    className="w-full px-4 py-2.5 text-gray-900 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition"
                                    placeholder="Nhập số điện thoại nhận hàng"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
                                <textarea
                                    id="address"
                                    rows={3}
                                    className="w-full px-4 py-2.5 text-gray-900 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition resize-none"
                                    placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện...)"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn mã giảm giá</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none"
                                    value={selectedPromotion?._id || ''}
                                    onChange={(e) => {
                                        const promoId = e.target.value;
                                        const promo = promotions.find(p => p._id === promoId);
                                        setSelectedPromotion(promo || null);
                                    }}
                                >
                                    <option value="">Không áp dụng mã giảm giá</option>
                                    {promotions.map(promo => {
                                        const isEligible = cartData.total >= promo.threshold_amount;
                                        return (
                                            <option key={promo._id} value={promo._id}>
                                                {promo.name} (-{promo.discount_percent}%{isEligible ? '' : ` - Yêu cầu tối thiểu ${formatCurrency(promo.threshold_amount)}`})
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedPromotion && !isEligibleForPromotion && (
                                    <p className="text-xs text-amber-600 mt-2 font-medium">
                                        ⚠️ Đơn hàng của bạn chưa đạt mức tối thiểu {formatCurrency(selectedPromotion.threshold_amount)} để áp dụng mã giảm giá này!
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Phương thức thanh toán</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${paymentMethod === 'COD' ? 'border-green-600 bg-green-50/50 text-green-950 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={() => setPaymentMethod('COD')}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold">Thanh toán khi nhận hàng (COD)</p>
                                            <p className="text-xs opacity-80 mt-0.5">Trả tiền mặt khi shipper giao hàng tận nơi</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${paymentMethod === 'BANK' ? 'border-green-600 bg-green-50/50 text-green-950 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="BANK"
                                            checked={paymentMethod === 'BANK'}
                                            onChange={() => setPaymentMethod('BANK')}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold">Chuyển khoản ngân hàng</p>
                                            <p className="text-xs opacity-80 mt-0.5">Chuyển khoản qua ứng dụng ngân hàng / QR Pay</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition duration-150 active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed uppercase text-sm tracking-wider shadow-md shadow-green-600/10"
                            >
                                {isSubmitting ? 'Đang xử lý đặt hàng...' : 'Xác nhận đặt hàng'}
                            </button>
                        </form>
                    </div>

                    {/* Right Order Summary */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">Chi tiết giỏ hàng</h2>

                            <div className="divide-y max-h-[350px] overflow-y-auto pr-1">
                                {cartData.items.map(item => (
                                    <div key={item.cartKey} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                        <img
                                            src={getProductImage(item.image)}
                                            alt={item.name}
                                            className="w-14 h-14 object-contain rounded-lg border p-1"
                                        />
                                        <div className="flex-grow min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">Số lượng: {item.quantity}</p>
                                            <p className="text-sm font-bold text-green-600 mt-1">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Tạm tính:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(cartData.total)}</span>
                                </div>
                                {activeDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Giảm giá ({selectedPromotion?.name}):</span>
                                        <span>-{formatCurrency(activeDiscount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-gray-900 border-t pt-3 text-base">
                                    <span>Tổng số tiền:</span>
                                    <span className="text-xl text-red-600">{formatCurrency(activePayable)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional info badge */}
                        <div className="bg-green-50/50 border border-green-100 rounded-2xl p-5 flex gap-4 items-start">
                            <span className="text-2xl">🛡️</span>
                            <div>
                                <h4 className="text-sm font-bold text-green-900">Cam kết FruitShop</h4>
                                <p className="text-xs text-green-800/90 mt-1 leading-relaxed">
                                    Trái cây nhập khẩu và nội địa luôn tươi ngon, sạch sẽ và an toàn. Đổi trả hàng miễn phí trong vòng 24h nếu chất lượng không đạt yêu cầu.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
