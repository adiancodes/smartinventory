export interface PurchaseResponse {
    id: number;
    productId: number;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    purchasedAt: string;
    warehouseName: string;
    warehouseCode: string;
}
export interface PurchaseHistoryResponse {
    purchases: PurchaseResponse[];
    totalSpend: number;
}
export interface SalesSummaryResponse {
    totalOrders: number;
    totalItems: number;
    totalRevenue: number;
}
export interface WarehouseSalesSummary {
    warehouseId: number;
    warehouseName: string;
    warehouseCode: string;
    totalOrders: number;
    totalItems: number;
    totalRevenue: number;
}
export interface WarehouseProductSales {
    productId: number;
    productName: string;
    productSku: string;
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
}
export interface BuyProductPayload {
    productId: number;
    quantity: number;
}
