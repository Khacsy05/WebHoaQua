import { Product, Category } from "@/types/shop";
import { getAuthHeaders } from "@/services/authService";

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

export async function createProduct(
    name: string,
    price: number,
    image: File | null,
    category_id: string,
    description?: string,
    stock?: number
) {
    try {

        const formData = new FormData();

        formData.append("name", name);
        formData.append("price", price.toString());
        formData.append("category_id", category_id);

        if (description) formData.append("description", description);
        if (stock) formData.append("stock", stock.toString());

        if (image) {
            formData.append("image", image);
        }

        const authHeaders = getAuthHeaders();

        if (authHeaders && 'Content-Type' in authHeaders) {
            delete authHeaders['Content-Type'];
        }
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: authHeaders,
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create product");
        }

        const res = await response.json();
        return res.success ? res.data : null;

    } catch (error: any) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        throw error;
    }
}

export async function updateProduct(
    id: string,
    name: string,
    price: number,
    image: File | null,
    category_id: string,
    description?: string,
    stock?: number,
) {
    try {
        const formData = new FormData();

        formData.append("name", name);
        formData.append("price", price.toString());
        formData.append("category_id", category_id);

        if (description) formData.append("description", description);
        if (stock) formData.append("stock", stock.toString());

        if (image) {
            formData.append("image", image);
        }

        const authHeaders = getAuthHeaders();

        if (authHeaders && 'Content-Type' in authHeaders) {
            delete authHeaders['Content-Type'];
        }


        const response = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: authHeaders,
            body: formData
        });
        if (!response.ok) throw new Error("Failed to update product");
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        throw error;
    }
}


export async function deleteProduct(id: string) {
    try {
        const authHeaders = getAuthHeaders();
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        if (!response.ok) throw new Error("Failed to delete product");
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        throw error;
    }
}


