import api from "./axios";
import { WarehouseSummary } from "../types/product";

export async function fetchWarehouses(): Promise<WarehouseSummary[]> {
  const response = await api.get<WarehouseSummary[]>("/warehouses");
  return response.data;
}
