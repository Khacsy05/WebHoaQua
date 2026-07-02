'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ThankYouContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const id = searchParams.get('orderId');
        if (id) {
            setOrderId(id);
        }
    }, [searchParams]);

    const orderCode = orderId ? orderId.substring(orderId.length - 8).toUpperCase() : 'N/A';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-50 rounded-full -z-10 opacity-60"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-50 rounded-full -z-10 opacity-60"></div>

                {/* Success Animated Icon */}
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 animate-bounce">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Đặt hàng thành công!</h2>
                <p className="text-gray-500 text-sm font-medium mb-6">Cảm ơn bạn đã tin dùng và mua sắm tại FruitShop 🍎🥑</p>

                {/* Order Information Card */}
                {orderId && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 text-left space-y-2">
                        <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <span>Mã đơn hàng:</span>
                            <span className="font-mono text-gray-900 select-all">#{orderCode}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-medium italic border-t border-gray-100 pt-2 leading-relaxed">
                            * Hóa đơn chi tiết và thông báo xác nhận đơn hàng đang được gửi đến hòm thư email của bạn.
                        </div>
                    </div>
                )}

                {/* Guidance Text */}
                <p className="text-gray-600 text-sm leading-relaxed mb-8">
                    Đơn hàng của bạn đã được ghi nhận trên hệ thống và đang chờ Admin duyệt chuyển khoản hoặc chuẩn bị giao hàng. Quá trình giao hàng sẽ được cập nhật liên tục qua email.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/shop/orders"
                        className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-md shadow-green-600/10 active:scale-[0.99] text-center text-sm font-sans"
                    >
                        🔍 Xem đơn hàng của tôi
                    </Link>
                    <Link
                        href="/shop"
                        className="block w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-xl transition active:scale-[0.99] text-center text-sm font-sans"
                    >
                        🛍️ Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    );
}
