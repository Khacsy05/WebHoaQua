import { Promotion } from "@/types/shop";

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
