import api from "./axios";
import { Product, ProductFilters, ProductPayload } from "../types/product";

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.vendor) {
    params.set("vendor", filters.vendor);
  }
  if (filters.stockStatus) {
    params.set("stockStatus", filters.stockStatus);
  }
  if (filters.warehouseId) {
    params.set("warehouseId", String(filters.warehouseId));
  }

  const query = params.toString();
  const response = await api.get<Product[]>(`/products${query ? `?${query}` : ""}`);
  return response.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const response = await api.post<Product>("/products", payload);
  return response.data;
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function fetchProductCategories(warehouseId?: number): Promise<string[]> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouseId", String(warehouseId));
  }
  const query = params.toString();
  const response = await api.get<string[]>(`/products/categories${query ? `?${query}` : ""}`);
  return response.data;
}
