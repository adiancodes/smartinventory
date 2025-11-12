import type { AnalyticsDashboardResponse } from "../types/analytics";
export declare function fetchAnalyticsDashboard(warehouseId?: number): Promise<AnalyticsDashboardResponse>;
export declare function downloadAnalyticsExcel(warehouseId?: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare function downloadAnalyticsPdf(warehouseId?: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
