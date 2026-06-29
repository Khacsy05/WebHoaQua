import { Category } from "@/types/shop";
import { getAuthHeaders } from "@/services/authService";

export async function fetchCategories(): Promise<Category[]> {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error("Failed to fetch categories");
        const res = await response.json();
        return res.success && Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        return [];
    }
}

export async function createCategory(name: string, description?: string): Promise<{ success: boolean; message?: string; data?: Category }> {
    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi thêm danh mục:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

export async function updateCategory(id: string, name: string, description?: string): Promise<{ success: boolean; message?: string; data?: Category }> {
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi cập nhật danh mục:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error: any) {
        console.error("Lỗi khi xóa danh mục:", error);
        return { success: false, message: error.message || "Lỗi mạng" };
    }
}
