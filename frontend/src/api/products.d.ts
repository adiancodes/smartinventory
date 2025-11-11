import { Product, ProductFilters, ProductPayload } from "../types/product";
export declare function fetchProducts(filters?: ProductFilters): Promise<Product[]>;
export declare function createProduct(payload: ProductPayload): Promise<Product>;
export declare function updateProduct(id: number, payload: ProductPayload): Promise<Product>;
export declare function deleteProduct(id: number): Promise<void>;
