'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/helpers';
import { updateCartQuantity, removeFromCart, clearCart } from '@/utils/cart';
import { CartData, User, Promotion } from '@/types/shop';
import { fetchPromotions } from '@/services/promotionService';
import { createOrder } from '@/services/orderService';

interface CartDrawerProps {
    isOpen: boolean;
    cartData: CartData;
    user: User | null;
    onClose: () => void;
    onCartUpdated: () => void;
}

export default function CartDrawer({ isOpen, cartData, user, onClose, onCartUpdated }: CartDrawerProps) {
    const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

    useEffect(() => {
        if (isOpen) {
            const loadPromotions = async () => {
                const data = await fetchPromotions();
                setPromotions(data);
            };
            loadPromotions();
        }
    }, [isOpen]);

    const updateQuantity = (cartKey: string, newQty: number) => {
        updateCartQuantity(cartKey, newQty);
        onCartUpdated();
    };

    const removeItem = (cartKey: string) => {
        removeFromCart(cartKey);
        onCartUpdated();
    };

    const isEligibleForPromotion = selectedPromotion && cartData.total >= selectedPromotion.threshold_amount;
    const activeDiscount = isEligibleForPromotion
        ? Math.round(cartData.total * (selectedPromotion.discount_percent / 100))
        : 0;
    const activePayable = cartData.total - activeDiscount;

    const handleCheckout = async () => {
        if (!user || !user.customerId) {
            alert('Vui lòng đăng nhập trước khi thanh toán!');
            window.location.href = '/login';
            return;
        }

        if (cartData.items.length === 0) {
            alert('Giỏ hàng trống!');
            return;
        }

        setIsCheckingOut(true);
        const orderItems = cartData.items.map(item => ({
            product_id: String(item._id || item.id),
            quantity: item.quantity,
            addons: item.addons?.join(', ') || null
        }));

        const result = await createOrder({
            customer_id: user.customerId,
            items: orderItems,
            promotion_id: isEligibleForPromotion ? selectedPromotion._id : null
        });

        if (result.success) {
            alert('Đặt hàng thành công!');
            clearCart();
            setSelectedPromotion(null);
            onCartUpdated();
            onClose();
        } else {
            alert(result.message || result.error || 'Có lỗi xảy ra khi đặt hàng.');
            setIsCheckingOut(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b flex items-center justify-between">
                    <h4 className="text-lg font-bold">Giỏ hàng của bạn</h4>
                    <button className="text-2xl focus:outline-none" onClick={onClose}>&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {cartData.items.length === 0 ? (
                        <p className="text-center text-gray-400 py-16">Giỏ hàng trống</p>
                    ) : (
                        cartData.items.map(item => (
                            <div className="flex gap-4 p-3 border rounded-xl" key={item.cartKey}>
                                <img src={item.image || '/images/default.png'} className="w-16 h-16 object-contain" alt={item.name} />
                                <div className="flex-grow">
                                    <h5 className="text-sm font-bold truncate">{item.name}</h5>
                                    <span className="text-sm text-gray-500">{formatCurrency(item.price)}</span>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex border rounded">
                                            <button className="px-2" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>-</button>
                                            <span className="px-3 text-xs">{item.quantity}</span>
                                            <button className="px-2" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
                                        </div>
                                        <button className="text-xs text-red-500" onClick={() => removeItem(item.cartKey)}>Xóa</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t bg-gray-50 space-y-3">
                    {cartData.items.length > 0 && promotions.length > 0 && (
                        <div className="pb-2 border-b border-gray-200">
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Chọn mã giảm giá:</label>
                            <select
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-green-500 focus:outline-none"
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
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ⚠️ Đơn hàng cần đạt tối thiểu {formatCurrency(selectedPromotion.threshold_amount)} để dùng mã này!
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tổng cộng:</span>
                        <span>{formatCurrency(cartData.total)}</span>
                    </div>
                    {activeDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>Giảm giá ({selectedPromotion?.name}):</span>
                            <span>-{formatCurrency(activeDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                        <span>Phải trả:</span>
                        <span className="text-xl text-red-600">{formatCurrency(activePayable)}</span>
                    </div>
                    <button
                        className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition duration-150 active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={cartData.items.length === 0 || isCheckingOut}
                        onClick={handleCheckout}
                    >
                        {isCheckingOut ? 'Đang xử lý...' : 'Thanh toán'}
                    </button>
                </div>
            </div>
        </div>
    );
}