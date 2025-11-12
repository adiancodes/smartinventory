import api from "./axios";
import type { AnalyticsDashboardResponse } from "../types/analytics";

export async function fetchAnalyticsDashboard(warehouseId?: number) {
  const params = warehouseId ? { warehouseId } : undefined;
  const response = await api.get<AnalyticsDashboardResponse>('/analytics/dashboard', { params });
  return response.data;
}

export async function downloadAnalyticsExcel(warehouseId?: number) {
  const params = warehouseId ? { warehouseId } : undefined;
  const response = await api.get('/analytics/export/excel', {
    params,
    responseType: 'blob'
  });
  return response;
}

export async function downloadAnalyticsPdf(warehouseId?: number) {
  const params = warehouseId ? { warehouseId } : undefined;
  const response = await api.get('/analytics/export/pdf', {
    params,
    responseType: 'blob'
  });
  return response;
}
