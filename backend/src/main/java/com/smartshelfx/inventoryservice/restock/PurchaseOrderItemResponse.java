package com.smartshelfx.inventoryservice.restock;

import java.math.BigDecimal;

public record PurchaseOrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
