export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export interface Product {
    id: number;
    name: string;
    sku: string;
    category: string;
    vendor: string;
    reorderLevel: number;
    maxStockLevel: number;
    currentStock: number;
    lowStock: boolean;
    autoRestockEnabled: boolean;
    price: number;
    totalValue: number;
    warehouseId: number;
    warehouseName: string;
    warehouseCode: string;
    createdAt: string;
    updatedAt: string;
}
export interface ProductFilters {
    category?: string;
    vendor?: string;
    stockStatus?: StockStatus;
    warehouseId?: number;
}
export interface ProductPayload {
    name: string;
    sku: string;
    category: string;
    vendor: string;
    reorderLevel: number;
    maxStockLevel: number;
    currentStock: number;
    price: number;
    autoRestockEnabled: boolean;
    warehouseId?: number;
}
export interface WarehouseSummary {
    id: number;
    name: string;
    locationCode: string;
    active: boolean;
}
