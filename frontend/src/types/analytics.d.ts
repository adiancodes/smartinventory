export interface InventoryStatusSummary {
    totalProducts: number;
    totalUnits: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    autoRestockEnabledProducts: number;
}
export interface StatusSlice {
    key: string;
    productCount: number;
    totalUnits: number;
}
export interface MonthlyQuantityTrendPoint {
    year: number;
    month: number;
    restockedQuantity: number;
    soldQuantity: number;
}
export interface MonthlyFinancialPoint {
    year: number;
    month: number;
    restockSpend: number;
    salesRevenue: number;
}
export interface TopRestockedItem {
    productId: number | null;
    productName: string;
    productSku: string;
    totalQuantity: number;
    orderCount: number;
}
export interface RestockDemandPoint {
    productId: number | null;
    productName: string;
    productSku: string;
    restockedQuantity: number;
    soldQuantity: number;
}
export interface AnalyticsDashboardResponse {
    inventoryStatus: InventoryStatusSummary;
    statusDistribution: StatusSlice[];
    monthlyQuantityTrend: MonthlyQuantityTrendPoint[];
    monthlyFinancials: MonthlyFinancialPoint[];
    topRestockedItems: TopRestockedItem[];
    restockDemandComparison: RestockDemandPoint[];
    scopeLabel: string;
    generatedAt: string;
}
