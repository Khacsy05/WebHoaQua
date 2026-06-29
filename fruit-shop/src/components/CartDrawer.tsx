'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, getProductImage } from '@/utils/helpers';
import { updateCartQuantity, removeFromCart, removeAddonFromCartItem } from '@/utils/cart';
import { CartData, User } from '@/types/shop';

interface CartDrawerProps {
    isOpen: boolean;
    cartData: CartData;
    user: User | null;
    onClose: () => void;
    onCartUpdated: () => void;
}

export default function CartDrawer({ isOpen, cartData, user, onClose, onCartUpdated }: CartDrawerProps) {
    const router = useRouter();
    const updateQuantity = (cartKey: string, newQty: number) => {
        updateCartQuantity(cartKey, newQty, user?.name);
        onCartUpdated();
    };

    const removeItem = (cartKey: string) => {
        removeFromCart(cartKey, user?.name);
        onCartUpdated();
    };

    const handleRemoveAddon = (cartKey: string, addonName: string) => {
        removeAddonFromCartItem(cartKey, addonName, user?.name);
        onCartUpdated();
    };

    const handleProceedToCheckout = () => {
        if (!user || !user.customerId) {
            alert('Vui lòng đăng nhập trước khi thanh toán!');
            router.push('/login');
            return;
        }

        if (cartData.items.length === 0) {
            alert('Giỏ hàng trống!');
            return;
        }

        onClose();
        router.push('/shop/checkout');
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
                                <img src={getProductImage(item.image)} className="w-16 h-16 object-contain" alt={item.name} />
                                <div className="flex-grow">
                                    <h5 className="text-sm font-bold truncate">{item.name}</h5>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-sm text-gray-500">{formatCurrency(item.price)}</span>
                                        <span className="text-xs font-bold text-gray-400">Đơn giá</span>
                                    </div>

                                    {/* Danh sách dịch vụ đi kèm */}
                                    {item.addons && item.addons.length > 0 && (
                                        <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dịch vụ đi kèm:</p>
                                            {item.addons.map((addon, index) => (
                                                <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                                                    <span>{addon.name} (+{formatCurrency(addon.price)})</span>
                                                    <button
                                                        onClick={() => handleRemoveAddon(item.cartKey, addon.name)}
                                                        className="text-red-500 hover:text-red-700 ml-2 font-bold w-4 h-4 flex items-center justify-center rounded hover:bg-red-50 focus:outline-none transition"
                                                        title="Xóa dịch vụ này"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex border rounded">
                                            <button className="px-2" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>-</button>
                                            <span className="px-3 text-xs flex items-center">{item.quantity}</span>
                                            <button className="px-2" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
                                        </div>
                                        <button className="text-xs text-red-500 font-bold" onClick={() => removeItem(item.cartKey)}>Xóa sản phẩm</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t bg-gray-50 space-y-3">
                    <div className="flex justify-between font-bold text-gray-900 pt-2 text-md">
                        <span>Tổng cộng tạm tính:</span>
                        <span className="text-lg text-red-600">{formatCurrency(cartData.total)}</span>
                    </div>
                    <button
                        className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition duration-150 active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed uppercase text-sm tracking-wider"
                        disabled={cartData.items.length === 0}
                        onClick={handleProceedToCheckout}
                    >
                        Tiến hành thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
}