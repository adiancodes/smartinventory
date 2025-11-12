import api from "./axios";
export async function fetchAnalyticsDashboard(warehouseId) {
    const params = warehouseId ? { warehouseId } : undefined;
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
}
export async function downloadAnalyticsExcel(warehouseId) {
    const params = warehouseId ? { warehouseId } : undefined;
    const response = await api.get('/analytics/export/excel', {
        params,
        responseType: 'blob'
    });
    return response;
}
export async function downloadAnalyticsPdf(warehouseId) {
    const params = warehouseId ? { warehouseId } : undefined;
    const response = await api.get('/analytics/export/pdf', {
        params,
        responseType: 'blob'
    });
    return response;
}
