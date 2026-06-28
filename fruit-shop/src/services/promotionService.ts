import { Promotion } from "@/types/shop";
import { getAuthHeaders } from "@/services/authService";

// Lấy danh sách khuyến mãi đang hoạt động (cho khách hàng mua sắm)
export async function fetchPromotions(): Promise<Promotion[]> {
    try {
        const response = await fetch('/api/promotions');
        if (!response.ok) throw new Error("Failed to fetch promotions");
        const res = await response.json();
        return res.success && Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Lỗi khi tải mã giảm giá:", error);
        return [];
    }
}

// Lấy toàn bộ danh sách khuyến mãi bao gồm cả dừng hoạt động (dành cho Admin)
export async function fetchAllPromotions(): Promise<Promotion[]> {
    try {
        const response = await fetch('/api/promotions?all=true', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch all promotions");
        const res = await response.json();
        return res.success && Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Lỗi khi tải toàn bộ khuyến mãi:", error);
        return [];
    }
}

// Thêm mới chương trình khuyến mãi
export async function createPromotion(payload: Omit<Promotion, '_id' | 'id'>): Promise<{ success: boolean; message?: string; data?: Promotion }> {
    try {
        const response = await fetch('/api/promotions', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi thêm khuyến mãi:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

// Cập nhật chương trình khuyến mãi
export async function updatePromotion(id: string, payload: Omit<Promotion, '_id' | 'id'>): Promise<{ success: boolean; message?: string; data?: Promotion }> {
    try {
        const response = await fetch(`/api/promotions/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi cập nhật khuyến mãi:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

// Xóa chương trình khuyến mãi
export async function deletePromotion(id: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`/api/promotions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi xóa khuyến mãi:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}
