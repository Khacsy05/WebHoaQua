import { getAuthHeaders } from "./authService";

export async function fetchCustomers() {
    try {
        const authHeaders = getAuthHeaders();
        const response = await fetch('/api/customers', {
            headers: authHeaders
        });
        const data = await response.json();
        return data.success ? data.customers : [];
    } catch (error) {
        console.error("Lỗi khi tải danh sách khách hàng:", error);
        return [];
    }
}
