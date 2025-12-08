package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record WarehousePurchaseItemResponse(
        Long purchaseId,
        Long productId,
        String productName,
        String productSku,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        OffsetDateTime purchasedAt,
        String buyerName,
        String buyerEmail
) {
}
