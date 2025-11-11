import api from "./axios";
export async function fetchProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) {
        params.set("category", filters.category);
    }
    if (filters.vendor) {
        params.set("vendor", filters.vendor);
    }
    if (filters.stockStatus) {
        params.set("stockStatus", filters.stockStatus);
    }
    if (filters.warehouseId) {
        params.set("warehouseId", String(filters.warehouseId));
    }
    const query = params.toString();
    const response = await api.get(`/products${query ? `?${query}` : ""}`);
    return response.data;
}
export async function createProduct(payload) {
    const response = await api.post("/products", payload);
    return response.data;
}
export async function updateProduct(id, payload) {
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
}
export async function deleteProduct(id) {
    await api.delete(`/products/${id}`);
}
