import { Addon } from "@/types/shop";
import { getAuthHeaders } from "@/services/authService";

export async function fetchAddons(): Promise<Addon[]> {
    try {
        const response = await fetch('/api/addons');
        if (!response.ok) throw new Error("Failed to fetch addons");
        const res = await response.json();
        return res.success && Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Lỗi khi tải addons:", error);
        return [];
    }
}

export async function createAddon(
    name: string,
    price: number,
    description?: string,
    active?: boolean
) {
    try {
        const authHeaders = getAuthHeaders();
        const response = await fetch('/api/addons', {
            method: 'POST',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                price,
                description,
                active,
            }),
        });
        if (!response.ok) throw new Error("Failed to create addon");
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi tạo addon:", error);
        throw error;
    }
}

export async function updateAddon(
    id: string,
    name: string,
    price: number,
    description?: string,
    active?: boolean
) {
    try {
        const authHeaders = getAuthHeaders();
        const response = await fetch(`/api/addons/${id}`, {
            method: 'PUT',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                price,
                description,
                active,
            }),
        });
        if (!response.ok) throw new Error("Failed to update addon");
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi cập nhật addon:", error);
        throw error;
    }
}

export async function deleteAddon(id: string) {
    try {
        const authHeaders = getAuthHeaders();
        const response = await fetch(`/api/addons/${id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        if (!response.ok) throw new Error("Failed to delete addon");
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi xóa addon:", error);
        throw error;
    }
}

