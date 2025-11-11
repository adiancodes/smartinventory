import api from "./axios";
import {
  PurchaseOrderPayload,
  PurchaseOrderResponse,
  RestockSuggestion,
  RestockSuggestionFilters
} from "../types/restock";

export async function fetchRestockSuggestions(filters: RestockSuggestionFilters = {}): Promise<RestockSuggestion[]> {
  const params = new URLSearchParams();

  if (filters.warehouseId) {
    params.set("warehouseId", String(filters.warehouseId));
  }
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (typeof filters.autoOnly === "boolean") {
    params.set("autoOnly", String(filters.autoOnly));
  }
  if (filters.stockStatus) {
    params.set("stockStatus", filters.stockStatus);
  }

  const query = params.toString();
  const response = await api.get<RestockSuggestion[]>(`/restock/suggestions${query ? `?${query}` : ""}`);
  return response.data;
}

export async function createPurchaseOrder(payload: PurchaseOrderPayload): Promise<PurchaseOrderResponse> {
  const response = await api.post<PurchaseOrderResponse>("/restock/purchase-orders", payload);
  return response.data;
}
