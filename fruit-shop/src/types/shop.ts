export interface Category {
    id?: number;
    _id?: string;
    name: string;
}

export interface Product {
    id?: number;
    _id?: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    image?: string;
    category?: Category;
    category_id?: Category;
}

export interface CartItem {
    cartKey: string;
    id?: number;
    _id?: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
    image?: string;
    addons?: string[];
}

export interface CartData {
    items: CartItem[];
    total: number;
    discount: number;
    payable: number;
    totalItems: number;
}

export interface User {
    name: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MANAGER';
    customerId?: string;
}

export interface Promotion {
    _id: string;
    name: string;
    type: string;
    discount_percent: number;
    threshold_amount: number;
    active: boolean;
}