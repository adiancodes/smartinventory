package com.smartshelfx.inventoryservice.analytics;

import java.math.BigDecimal;

public record ProductSalesAggregate(
        Long productId,
        String productName,
        String productSku,
        long totalQuantity,
        BigDecimal totalRevenue
) {
}
