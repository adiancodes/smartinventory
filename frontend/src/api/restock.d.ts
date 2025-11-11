import { PurchaseOrderPayload, PurchaseOrderResponse, RestockSuggestion, RestockSuggestionFilters } from "../types/restock";
export declare function fetchRestockSuggestions(filters?: RestockSuggestionFilters): Promise<RestockSuggestion[]>;
export declare function createPurchaseOrder(payload: PurchaseOrderPayload): Promise<PurchaseOrderResponse>;
