import { StockStatus } from "./product";

export interface RestockSuggestion {
  productId: number;
  productName: string;
  productSku: string;
  category: string;
  vendor: string;
  warehouseId: number;
  warehouseName: string;
  currentStock: number;
  reorderLevel: number;
  maxStockLevel: number;
  autoRestockEnabled: boolean;
  unitPrice: number;
  averageDailyDemand: number;
  projectedDaysUntilStockout: number;
  suggestedReorderQuantity: number;
  recommendationReason: string;
}

export interface RestockSuggestionFilters {
  warehouseId?: number;
  category?: string;
  autoOnly?: boolean;
  stockStatus?: StockStatus;
}

export interface PurchaseOrderItemDraft {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderPayload {
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorContactPreference?: string;
  notes?: string;
  warehouseId: number;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItemDraft[];
  sendEmail: boolean;
  sendSms: boolean;
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_VENDOR_APPROVAL"
  | "SENT_TO_VENDOR"
  | "NOTIFICATION_FAILED";

export interface PurchaseOrderResponse {
  id: number;
  reference: string;
  status: PurchaseOrderStatus;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorContactPreference?: string;
  notes?: string;
  warehouseId: number;
  warehouseName: string;
  createdById: number;
  createdByName: string;
  expectedDeliveryDate?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: PurchaseOrderItem[];
}
