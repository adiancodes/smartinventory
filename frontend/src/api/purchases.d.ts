import { BuyProductPayload, PurchaseHistoryResponse, PurchaseResponse, SalesSummaryResponse, WarehouseProductSales, WarehouseSalesSummary } from "../types/purchase";
export declare function purchaseProduct(payload: BuyProductPayload): Promise<PurchaseResponse>;
export declare function fetchUserPurchaseHistory(): Promise<PurchaseHistoryResponse>;
export declare function fetchAdminSalesSummary(): Promise<SalesSummaryResponse>;
export declare function fetchManagerSalesSummary(): Promise<SalesSummaryResponse>;
export declare function fetchAdminSalesByWarehouse(): Promise<WarehouseSalesSummary[]>;
export declare function fetchAdminProductSalesForWarehouse(warehouseId: number): Promise<WarehouseProductSales[]>;
