package com.smartshelfx.inventoryservice.restock;

public interface VendorNotificationService {

    VendorNotificationResult dispatchPurchaseOrder(PurchaseOrderEntity purchaseOrder,
                                                    PurchaseOrderNotificationOptions options);
}
