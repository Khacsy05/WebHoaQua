'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, showNotification } from '@/utils/helpers';
import { Product } from '@/types/shop';

import { addToCart } from '@/utils/cart';

interface AddonModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    username?: string | null;
    onCartUpdated: () => void;
}

interface AddonsState {
    engrave: boolean;
    peel: boolean;
    wrap: boolean;
}

export default function AddonModal({ isOpen, onClose, product, username, onCartUpdated }: AddonModalProps) {
    const [quantity, setQuantity] = useState<number>(1);
    const [addons, setAddons] = useState<AddonsState>({ engrave: false, peel: false, wrap: false });
    const [totalPrice, setTotalPrice] = useState<number>(0);

    const addonPrices: Record<keyof AddonsState, number> = { engrave: 50000, peel: 20000, wrap: 15000 };

    useEffect(() => {
        if (!product) return;
        setQuantity(1);
        setAddons({ engrave: false, peel: false, wrap: false });
        setTotalPrice(Number(product.price));
    }, [product, isOpen]);

    useEffect(() => {
        if (!product) return;
        let price = Number(product.price);
        if (addons.engrave) price += addonPrices.engrave;
        if (addons.peel) price += addonPrices.peel;
        if (addons.wrap) price += addonPrices.wrap;
        setTotalPrice(price);
    }, [addons, product]);

    if (!isOpen || !product) return null;

    const handleCheckboxChange = (key: keyof AddonsState) => {
        setAddons(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfirmAddCart = () => {
        if (!product) return;
        
        const selectedAddonsList = (Object.keys(addons) as Array<keyof AddonsState>).filter(key => addons[key]);
        
        addToCart(product, quantity, selectedAddonsList, username);
        
        onClose();
        onCartUpdated();
        showNotification('Đã thêm vào giỏ hàng!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full relative z-10 overflow-hidden animate-scaleIn flex flex-col md:flex-row">
                <button className="absolute top-4 right-4 text-gray-400 text-2xl hover:text-gray-600 transition" onClick={onClose}>&times;</button>
                <div className="md:w-5/12 bg-gray-50 flex items-center justify-center p-6">
                    <img src={product.image ? (product.image.startsWith('/') ? product.image : `/images/${product.image}`) : '/images/default.png'} alt={product.name} className="max-h-64 object-contain" />
                </div>
                <div className="md:w-7/12 p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>Mã sản phẩm: <span className="font-semibold text-gray-700">SP{product.id || product._id}</span></span>
                        <span>|</span>
                        <span>Tình trạng: <span className={`font-semibold ${product.stock > 0 ? 'text-blue-600' : 'text-red-500'}`}>{product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}</span></span>
                    </div>

                    <div className="text-3xl font-black text-red-600 mb-6">
                        {formatCurrency(totalPrice).replace('đ', '')}<span className="underline">đ</span>
                    </div>

                    <div className="text-sm font-bold text-gray-800 mb-3">Dịch vụ đi kèm:</div>
                    <div className="mb-6 space-y-2.5">
                        {(Object.keys(addonPrices) as Array<keyof AddonsState>).map(key => (
                            <div
                                key={key}
                                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${addons[key]
                                        ? 'border-red-600 bg-red-50/50 text-red-600 font-semibold'
                                        : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                                    }`}
                                onClick={() => handleCheckboxChange(key)}
                            >
                                <span className="text-sm">
                                    {key === 'engrave'
                                        ? 'Khắc chữ nghệ thuật (+50.000đ)'
                                        : key === 'peel'
                                            ? 'Cắt gọt sẵn đóng hộp (+20.000đ)'
                                            : 'Bọc xốp lụa cao cấp làm quà biếu (+15.000đ)'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <span className="font-bold text-gray-800">Số lượng:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                            <button className="px-3 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-lg" onClick={() => quantity > 1 && setQuantity(quantity - 1)}>-</button>
                            <span className="px-4 py-1 text-gray-800 font-semibold">{quantity}</span>
                            <button className="px-3 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-lg" onClick={() => setQuantity(quantity + 1)}>+</button>
                        </div>
                    </div>
                    <button
                        className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg tracking-wider text-md transition active:scale-[0.99] uppercase shadow-md shadow-red-200"
                        onClick={handleConfirmAddCart}
                    >
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    );
}