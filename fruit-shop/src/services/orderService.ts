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
