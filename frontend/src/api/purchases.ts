import api from "./axios";
import {
  BuyProductPayload,
  PurchaseHistoryResponse,
  PurchaseResponse,
  SalesSummaryResponse,
  WarehouseProductSales,
  WarehouseSalesSummary
} from "../types/purchase";

export async function purchaseProduct(payload: BuyProductPayload): Promise<PurchaseResponse> {
  const response = await api.post<PurchaseResponse>("/purchases", payload);
  return response.data;
}

export async function fetchUserPurchaseHistory(): Promise<PurchaseHistoryResponse> {
  const response = await api.get<PurchaseHistoryResponse>("/purchases/me");
  return response.data;
}

export async function fetchAdminSalesSummary(): Promise<SalesSummaryResponse> {
  const response = await api.get<SalesSummaryResponse>("/purchases/summary/admin");
  return response.data;
}

export async function fetchManagerSalesSummary(): Promise<SalesSummaryResponse> {
  const response = await api.get<SalesSummaryResponse>("/purchases/summary/manager");
  return response.data;
}

export async function fetchAdminSalesByWarehouse(): Promise<WarehouseSalesSummary[]> {
  const response = await api.get<WarehouseSalesSummary[]>("/purchases/summary/admin/by-warehouse");
  return response.data;
}

export async function fetchAdminProductSalesForWarehouse(warehouseId: number): Promise<WarehouseProductSales[]> {
  const response = await api.get<WarehouseProductSales[]>(
    `/purchases/summary/admin/by-warehouse/${warehouseId}/products`
  );
  return response.data;
}
