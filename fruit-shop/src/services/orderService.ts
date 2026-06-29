import { getAuthHeaders } from "./authService";

export interface CheckoutPayload {
    customer_id: string;
    items: {
        product_id: string | number;
        quantity: number;
        addons: string | null;
    }[];
    promotion_id?: string | null;
    address?: string;
    phone?: string;
    payment_method?: string;
}

export async function createOrder(payload: CheckoutPayload): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        return { success: false, error: error.message || "Lỗi mạng" };
    }
}

export async function fetchOrders() {
    try {
        const response = await fetch('/api/orders', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        return data.success ? data.orders : [];
    } catch (error: any) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        return [];
    }
}

export async function fetchOrderById(id: string) {
    try {
        const response = await fetch(`/api/orders/${id}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        return data.success ? { order: data.order, items: data.items } : null;
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        return null;
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const authHeaders = getAuthHeaders();
        const response = await fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}