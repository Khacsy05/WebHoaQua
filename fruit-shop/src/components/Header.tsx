'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopStore } from '@/store/useShopStore';
import { getCart } from '@/utils/cart';
import { CartData } from '@/types/shop';
import CartDrawer from '@/components/CartDrawer';
import { updateCurrentUser, changePassword } from '@/services/authService';

interface HeaderProps {
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
    onSearchSubmit?: () => void;
}

const POPULAR_KEYWORDS = [
    'Cam sành',
    'Nước ép detox',
    'Hộp quà',
    'Táo Envy',
    'Xoài cát',
    'Sầu riêng Ri6',
    'Dưa hấu'
];

export default function Header({
    searchQuery = '',
    setSearchQuery,
    onSearchSubmit
}: HeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loadUser, logout, setUser, hasHydrated } = useAuthStore();
    const { categories, loadShopData } = useShopStore();
    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Cart state
    const [cartData, setCartData] = useState<CartData>({
        items: [],
        total: 0,
        discount: 0,
        payable: 0,
        totalItems: 0
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Search state
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);

    // Profile Modal state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileTab, setProfileTab] = useState<'info' | 'password'>('info');
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem("fruit_shop_token") : null;
        if (token) {
            loadUser().finally(() => setAuthChecked(true));
        } else {
            setAuthChecked(true);
        }
        if (categories.length === 0) {
            loadShopData(null, false, true);
        }
    }, [loadUser, categories.length, loadShopData]);

    const loadCartItems = () => {
        try {
            const data = getCart(user?.name);
            setCartData(data);
        } catch (error) {
            console.error('Lỗi khi tải giỏ hàng:', error);
        }
    };

    useEffect(() => {
        loadCartItems();
    }, [user]);

    // Chỉ sync từ URL khi URL search thay đổi (người dùng chuyển trang hoặc bấm nút tìm kiếm), không tự ghi đè khi đang gõ/xóa
    const prevUrlSearchRef = useRef<string | null>(null);
    useEffect(() => {
        const urlSearch = searchParams?.get('search') ?? '';
        if (prevUrlSearchRef.current !== urlSearch) {
            prevUrlSearchRef.current = urlSearch;
            setLocalQuery(urlSearch);
        }
    }, [searchParams]);

    // Click outside to close Search Dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const insideDesktop = searchContainerRef.current?.contains(target);
            const insideMobile = mobileSearchRef.current?.contains(target);
            if (!insideDesktop && !insideMobile) {
                setIsSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    };

    const executeSearch = (targetQuery?: string) => {
        const q = typeof targetQuery === 'string' ? targetQuery : localQuery;
        setIsSearchFocused(false);

        if (setSearchQuery) {
            setSearchQuery(q);
        }
        if (onSearchSubmit) {
            onSearchSubmit();
        }

        router.push(`/shop?search=${encodeURIComponent(q.trim())}`);
    };

    const handleKeywordClick = (keyword: string) => {
        setLocalQuery(keyword);
        executeSearch(keyword);
    };

    const openProfileModal = () => {
        if (user) {
            setProfileTab('info');
            setProfileForm({
                name: user.customer?.name || user.name || '',
                phone: user.customer?.phone || '',
                address: user.customer?.address || ''
            });
            setPasswordForm({
                oldPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
            setProfileError('');
            setProfileSuccess('');
            setIsProfileOpen(true);
        }
    };

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (passwordForm.newPassword.length < 6) {
            setProfileError('Mật khẩu mới phải từ 6 ký tự trở lên!');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setProfileError('Mật khẩu xác nhận không khớp!');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
            if (res.success) {
                setProfileSuccess('Đổi mật khẩu thành công!');
                setPasswordForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                });
            } else {
                setProfileError(res.message || 'Đổi mật khẩu thất bại!');
            }
        } catch (err: any) {
            setProfileError(err.message || 'Lỗi mạng');
        } finally {
            setPasswordLoading(false);
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

    const isAdmin = user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER');

    const getAvatarInitials = () => {
        const name = user?.customer?.name || user?.name || 'AF';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <header className="w-full bg-white font-sans sticky top-0 z-40 shadow-xs border-b border-gray-100">
            {/* TOP BAR - Deep Emerald Green */}
            <div className="bg-[#0b8043] text-white text-xs py-1.5 px-4">
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
                    {/* Left side links */}
                    <div className="flex items-center gap-3">
                        {isAdmin ? (
                            <Link href="/admin/dashboard" className="hover:text-green-100 font-medium transition flex items-center gap-1">
                                Kênh Người Bán
                            </Link>
                        ) : (
                            <Link href="/shop" className="hover:text-green-100 font-medium transition flex items-center gap-1">
                                Kênh Người Bán
                            </Link>
                        )}
                        <span className="text-white/40">|</span>
                        <div className="flex items-center gap-1 hover:text-green-100 cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeWidth="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2"></line>
                            </svg>
                            <span>Tải Ứng Dụng FruitShop</span>
                        </div>
                        <span className="text-white/40">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-white/90">Kết Nối:</span>
                            <span className="hover:text-green-100 cursor-pointer inline-flex items-center">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="18" cy="5" r="3" strokeWidth="2" />
                                    <circle cx="6" cy="12" r="3" strokeWidth="2" />
                                    <circle cx="18" cy="19" r="3" strokeWidth="2" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="2" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="2" />
                                </svg>
                            </span>
                            <span className="hover:text-green-100 cursor-pointer inline-flex items-center">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Right side info */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-white/95">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="font-medium">100% Chuẩn VietGAP & GlobalGAP</span>
                        </div>
                        <span className="text-white/40">|</span>
                        <div className="flex items-center gap-1 hover:text-green-100 cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" />
                            </svg>
                            <span>Trợ Giúp</span>
                        </div>
                        <span className="text-white/40">|</span>
                        <a href="tel:19008899" className="flex items-center gap-1 hover:text-green-100 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>Hotline: <strong className="font-bold">1900 8899</strong></span>
                        </a>
                    </div>
                </div>
            </div>

            {/* MAIN HEADER ROW */}
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <Link href="/shop" className="flex items-center gap-2.5 flex-shrink-0 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008f4c] to-[#0a6d3b] flex items-center justify-center text-white shadow-md shadow-green-600/20 group-hover:scale-105 transition duration-200">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c.4 0 .7.3.7.7 0 1.3.8 2.3 2.1 2.3.4 0 .7.3.7.7s-.3.7-.7.7c-2.1 0-3.5-1.5-3.5-3.7 0-.4.3-.7.7-.7z" />
                                <path d="M12 6.5c-1.8-1.5-4.2-1.5-6.2 0C3.7 7.9 3 10.3 3 12.8c0 4.2 2.7 8.2 5.5 8.2 1.2 0 2.2-.8 3.5-.8 1.3 0 2.3.8 3.5.8 2.8 0 5.5-4 5.5-8.2 0-2.5-.7-4.9-2.8-6.3-2-1.5-4.4-1.5-6.2 0z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-[#0b8043] tracking-tight leading-none">
                                FruitShop
                            </span>
                            <span className="text-[9.5px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
                                Nông Trại Hữu Cơ
                            </span>
                        </div>
                    </Link>

                    {/* Search Bar Center (Desktop) */}
                    <div ref={searchContainerRef} className="flex-1 max-w-2xl hidden md:block relative">
                        <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm trái cây tươi, nước ép detox, giỏ quà biếu..."
                                value={localQuery}
                                onFocus={() => setIsSearchFocused(true)}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full pl-10 pr-32 py-2 text-sm bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#0b8043] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0b8043]/15 transition"
                            />
                            {localQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLocalQuery('');
                                        if (setSearchQuery) setSearchQuery('');
                                        setIsSearchFocused(false);
                                        router.push('/shop');
                                    }}
                                    className="absolute right-24 text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
                                    title="Xóa tìm kiếm"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={() => executeSearch()}
                                className="absolute right-1 px-4 py-1.5 bg-[#0b8043] hover:bg-[#096d39] text-white text-xs font-semibold rounded-full shadow-sm transition active:scale-95 cursor-pointer"
                            >
                                Tìm kiếm
                            </button>
                        </div>

                        {/* Search Hot Tags below bar */}
                        <div className="flex items-center gap-2 mt-1 px-3 text-[11px] text-gray-500 overflow-x-auto whitespace-nowrap">
                            <span className="text-gray-400">Tìm kiếm hot:</span>
                            <button onClick={() => handleKeywordClick('Cam sành')} className="hover:text-[#0b8043] cursor-pointer">Cam sành Hàm Yên</button>
                            <button onClick={() => handleKeywordClick('Nước ép')} className="hover:text-[#0b8043] cursor-pointer">Nước ép cần tây</button>
                            <button onClick={() => handleKeywordClick('Táo')} className="hover:text-[#0b8043] cursor-pointer">Táo Envy Mỹ</button>
                            <button onClick={() => handleKeywordClick('Xoài')} className="hover:text-[#0b8043] cursor-pointer">Xoài cát Hòa Lộc</button>
                            <button onClick={() => handleKeywordClick('Giỏ quà')} className="text-amber-600 font-semibold hover:text-amber-700 cursor-pointer">Giỏ quà Tết -20%</button>
                        </div>

                        {/* DROPDOWN XỔ XUỐNG KHI ONFOCUS VÀ CHƯA GÕ GÌ (GỢI Ý TỪ KHÓA PHỔ BIẾN) */}
                        {isSearchFocused && !localQuery.trim() && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        <svg className="w-4 h-4 text-[#0b8043]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        <span>Từ khóa tìm kiếm phổ biến</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_KEYWORDS.map((keyword, idx) => (
                                            <button
                                                key={idx}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleKeywordClick(keyword);
                                                }}
                                                className="px-3.5 py-1.5 rounded-full bg-gray-50 hover:bg-green-50 hover:text-[#0b8043] text-gray-700 text-xs font-medium border border-gray-100 hover:border-green-200 transition cursor-pointer flex items-center gap-1.5"
                                            >
                                                <span className="text-gray-300">🔍</span>
                                                <span>{keyword}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Action Icons & User Account */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Notification Bell with red dot */}
                        <button
                            className="relative text-gray-600 hover:text-[#0b8043] p-1.5 transition focus:outline-none"
                            title="Thông báo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>

                        {/* Cart icon - ONLY SHOW WHEN NOT ADMIN/MANAGER */}
                        {!isAdmin && (
                            <button
                                className="relative text-gray-700 hover:text-[#0b8043] p-1.5 transition focus:outline-none cursor-pointer"
                                onClick={() => setIsCartOpen(true)}
                                title="Giỏ hàng"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="9" cy="21" r="1" strokeWidth="2"></circle>
                                    <circle cx="20" cy="21" r="1" strokeWidth="2"></circle>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                {cartData.totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#f97316] text-[10px] font-bold text-white shadow-xs">
                                        {cartData.totalItems}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* User Login / Profile Pill */}
                        {!mounted || !hasHydrated || (!authChecked && !user) ? (
                            <div className="w-32 h-8 bg-gray-100 rounded-full animate-pulse"></div>
                        ) : !user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-[#0b8043] transition"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#0b8043] hover:bg-[#096d39] text-white rounded-full transition shadow-xs"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition focus:outline-none cursor-pointer"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#4ade80] text-[#064e3b] text-[10px] font-black flex items-center justify-center">
                                        {getAvatarInitials()}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-800 max-w-[130px] truncate">
                                        Chào, {user.customer?.name || user.name}
                                    </span>
                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <ul className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn text-xs">
                                        {isAdmin && (
                                            <li>
                                                <Link
                                                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-green-50/60 font-semibold text-[#0b8043]"
                                                    href="/admin/dashboard"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                                                        <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                                                        <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
                                                        <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                                                    </svg>
                                                    Kênh Quản Trị
                                                </Link>
                                            </li>
                                        )}

                                        <li>
                                            <button
                                                onClick={() => {
                                                    openProfileModal();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                                            >
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Thông tin tài khoản
                                            </button>
                                        </li>

                                        {!isAdmin && (
                                            <li>
                                                <Link
                                                    href="/shop/orders"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium"
                                                >
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                    </svg>
                                                    Đơn hàng của tôi
                                                </Link>
                                            </li>
                                        )}

                                        <div className="border-t border-gray-100 my-1"></div>

                                        <li>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    router.push('/login');
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                                            >
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Đăng xuất
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Search Input */}
                <div ref={mobileSearchRef} className="mt-3 block md:hidden relative">
                    <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm trái cây..."
                            value={localQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full pl-10 pr-24 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#0b8043]"
                        />
                        {localQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLocalQuery('');
                                    if (setSearchQuery) setSearchQuery('');
                                    setIsSearchFocused(false);
                                    router.push('/shop');
                                }}
                                className="absolute right-12 text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => executeSearch()}
                            className="absolute right-1 px-3 py-1 bg-[#0b8043] text-white text-[11px] font-semibold rounded-full"
                        >
                            Tìm
                        </button>
                    </div>

                    {/* Mobile Dropdown */}
                    {isSearchFocused && !localQuery.trim() && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                            <div className="p-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Từ khóa phổ biến</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {POPULAR_KEYWORDS.map((k, i) => (
                                        <button
                                            key={i}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleKeywordClick(k);
                                            }}
                                            className="px-2.5 py-1 rounded-full bg-gray-50 text-[11px] text-gray-700 border border-gray-100"
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* NAV BAR - TẦNG 1: MENU SẢN PHẨM ▾ VÀ CÁC DANH MỤC TRỰC TIẾP */}
            <div className="border-t border-gray-100 bg-white shadow-xs">
                <div className="container mx-auto px-4 flex items-center justify-between text-xs font-semibold text-gray-700">
                    <div className="flex items-center gap-6 py-2.5 overflow-x-auto">
                        {/* Nút Sản Phẩm ▾ Xổ xuống 100% tất cả danh mục */}
                        <div className="relative group">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0b8043] text-white rounded-xl font-bold hover:bg-[#096d39] transition shadow-xs cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span>Sản phẩm</span>
                                <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* MEGA MENU XỔ XUỐNG: 100% TẤT CẢ DANH MỤC TRONG DB */}
                            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 divide-y divide-gray-50">
                                <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Tất cả danh mục sản phẩm
                                </div>
                                <div className="py-1 max-h-80 overflow-y-auto">
                                    {categories.map((cat) => {
                                        const catId = cat._id || cat.id;
                                        return (
                                            <Link
                                                key={catId}
                                                href={`/shop/category/${catId}`}
                                                className="flex items-center justify-between px-3.5 py-2 hover:bg-green-50/60 text-gray-700 hover:text-[#0b8043] transition rounded-lg mx-1"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-base">{cat.icon || '🍏'}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900 leading-tight">{cat.name}</p>
                                                        {cat.description && (
                                                            <p className="text-[10px] text-gray-400 truncate max-w-[170px]">{cat.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-gray-300 text-xs">&rsaquo;</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="p-2 bg-gray-50/50">
                                    <Link
                                        href="/shop"
                                        className="w-full block text-center py-1.5 text-[11px] font-bold text-[#0b8043] hover:underline"
                                    >
                                        Xem tất cả sản phẩm &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Top Direct Navigation Categories */}
                        <Link href="/shop" className="hover:text-[#0b8043] transition whitespace-nowrap">
                            Trang chủ
                        </Link>
                        {categories.slice(0, 5).map(cat => {
                            const catId = cat._id || cat.id;
                            return (
                                <Link
                                    key={catId}
                                    href={`/shop/category/${catId}`}
                                    className="hover:text-[#0b8043] transition whitespace-nowrap flex items-center gap-1 text-gray-600"
                                >
                                    <span>{cat.icon || '🌱'}</span>
                                    <span>{cat.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden lg:flex items-center gap-4 text-xs font-bold text-[#0b8043]">
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                            ⚡ Flash Sale - Giảm tới 40%
                        </span>
                        <a href="tel:19008899" className="hover:underline">Hotline: 1900 8899</a>
                    </div>
                </div>
            </div>

            {/* CART DRAWER */}
            {!isAdmin && (
                <CartDrawer
                    isOpen={isCartOpen}
                    cartData={cartData}
                    user={user}
                    onClose={() => setIsCartOpen(false)}
                    onCartUpdated={loadCartItems}
                />
            )}

            {/* PROFILE MODAL */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 to-[#0b8043]"></div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Tài khoản của tôi</h3>
                            <button
                                onClick={() => setIsProfileOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 mb-6">
                            <button
                                onClick={() => { setProfileTab('info'); setProfileError(''); setProfileSuccess(''); }}
                                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition ${profileTab === 'info' ? 'border-[#0b8043] text-[#0b8043]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Thông tin cá nhân
                            </button>
                            <button
                                onClick={() => { setProfileTab('password'); setProfileError(''); setProfileSuccess(''); }}
                                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition ${profileTab === 'password' ? 'border-[#0b8043] text-[#0b8043]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Đổi mật khẩu
                            </button>
                        </div>

                        {profileError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold text-center border border-red-100">
                                {profileError}
                            </div>
                        )}

                        {profileSuccess && (
                            <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs rounded-xl font-semibold text-center border border-green-100">
                                {profileSuccess}
                            </div>
                        )}

                        {profileTab === 'info' ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Họ và tên</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b8043] focus:border-[#0b8043] transition text-sm text-gray-900 bg-white"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={user?.customer?.email || (user?.name ? `${user.name}@gmail.com` : '')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 transition text-sm cursor-not-allowed"
                                    />
                                    <span className="text-[10px] text-gray-400 mt-1 block">Email đăng ký không thể thay đổi</span>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b8043] focus:border-[#0b8043] transition text-sm text-gray-900 bg-white"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Địa chỉ nhận hàng</label>
                                    <textarea
                                        value={profileForm.address}
                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b8043] focus:border-[#0b8043] transition text-sm text-gray-900 bg-white min-h-[80px] resize-none"
                                        placeholder="Nhập địa chỉ của bạn"
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logout();
                                            router.push('/login');
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-1/3 py-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition focus:outline-none uppercase tracking-wider cursor-pointer"
                                    >
                                        Đăng xuất
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={profileLoading}
                                        className="flex-grow py-2.5 rounded-xl bg-[#0b8043] hover:bg-[#096d39] text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-green-100 focus:outline-none uppercase tracking-wider cursor-pointer"
                                    >
                                        {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mật khẩu cũ</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.oldPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b8043] focus:border-[#0b8043] transition text-sm text-gray-900 bg-white"
                                        placeholder="Nhập mật khẩu cũ"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b8043] focus:border-[#0b8043] transition text-sm text-gray-900 bg-white"
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.confirmNewPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b8043] focus:border-[#0b8043] transition text-sm text-gray-900 bg-white"
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logout();
                                            router.push('/login');
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-1/3 py-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition focus:outline-none uppercase tracking-wider cursor-pointer"
                                    >
                                        Đăng xuất
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="flex-grow py-2.5 rounded-xl bg-[#0b8043] hover:bg-[#096d39] text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-green-100 focus:outline-none uppercase tracking-wider cursor-pointer"
                                    >
                                        {passwordLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
