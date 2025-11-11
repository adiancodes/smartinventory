export interface DemandForecastSeriesPoint {
    weekStart: string;
    quantity: number;
}
export interface DemandForecastItem {
    productId: number;
    productName: string;
    productSku: string;
    currentStock: number;
    reorderLevel: number;
    forecastQuantity: number;
    atRisk: boolean;
    recommendedReorder: number;
    action: string;
    history: DemandForecastSeriesPoint[];
}
