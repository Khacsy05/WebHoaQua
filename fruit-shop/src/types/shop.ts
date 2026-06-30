export interface Category {
    id?: number;
    _id?: string;
    name: string;
    description: string;
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

export interface CartAddon {
    name: string;
    price: number;
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
    addons?: CartAddon[];
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
    customer?: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
    } | null;
}

export interface Promotion {
    _id?: string;
    name: string;
    type: string;
    start_date: Date;
    end_date: Date;
    discount_percent: number;
    threshold_amount: number;
    active: boolean;
}

export interface Addon {
    _id?: string;
    id?: string | number;
    name: string;
    price: number;
    description?: string;
    active: boolean;
    allowed_categories?: any[];
}

export interface CustomerType {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

export interface Order {
    _id?: string;
    customer_id: CustomerType | string;
    status: "NEW" | "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
    total_amount: number;
    discount_amount: number;
    payable_amount: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    items?: any[];
}