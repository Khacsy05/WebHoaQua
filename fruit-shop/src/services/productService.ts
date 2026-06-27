import { Product, Category } from "@/types/shop";

export async function fetchProducts(categoryId?: string | number | null): Promise<Product[]> {
    try {
        const url = categoryId ? `/api/products?categoryId=${categoryId}` : '/api/products';
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch products");
        const res = await response.json();
        return res.success && Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        return [];
    }
}

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

export async function fetchProductById(id: string): Promise<Product | null> {
    try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error("Failed to fetch product");
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        return null;
    }
}
