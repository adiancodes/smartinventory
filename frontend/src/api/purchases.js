import api from "./axios";
export async function purchaseProduct(payload) {
    const response = await api.post("/purchases", payload);
    return response.data;
}
export async function fetchUserPurchaseHistory() {
    const response = await api.get("/purchases/me");
    return response.data;
}
export async function fetchAdminSalesSummary() {
    const response = await api.get("/purchases/summary/admin");
    return response.data;
}
export async function fetchManagerSalesSummary() {
    const response = await api.get("/purchases/summary/manager");
    return response.data;
}
export async function fetchManagerPurchaseHistory() {
    const response = await api.get("/purchases/manager/history");
    return response.data;
}
export async function fetchAdminSalesByWarehouse() {
    const response = await api.get("/purchases/summary/admin/by-warehouse");
    return response.data;
}
export async function fetchAdminProductSalesForWarehouse(warehouseId) {
    const response = await api.get(`/purchases/summary/admin/by-warehouse/${warehouseId}/products`);
    return response.data;
}
