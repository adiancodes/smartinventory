package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UserPurchaseItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        OffsetDateTime purchasedAt,
        String warehouseName,
        String warehouseCode
) {}
