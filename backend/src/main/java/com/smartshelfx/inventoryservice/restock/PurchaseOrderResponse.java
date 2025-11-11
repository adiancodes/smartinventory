package com.smartshelfx.inventoryservice.restock;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PurchaseOrderResponse(
        Long id,
        String reference,
        PurchaseOrderStatus status,
        String vendorName,
        String vendorEmail,
        String vendorPhone,
        String vendorContactPreference,
        String notes,
        Long warehouseId,
        String warehouseName,
        Long createdById,
        String createdByName,
        OffsetDateTime expectedDeliveryDate,
        OffsetDateTime submittedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        BigDecimal subtotalAmount,
        BigDecimal taxAmount,
        BigDecimal shippingAmount,
        BigDecimal totalAmount,
        List<PurchaseOrderItemResponse> items
) {
}
