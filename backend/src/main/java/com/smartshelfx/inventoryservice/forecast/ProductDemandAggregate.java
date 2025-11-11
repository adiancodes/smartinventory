package com.smartshelfx.inventoryservice.forecast;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProductDemandAggregate(
        Long productId,
        String productName,
        String productSku,
        long totalQuantity,
        long totalOrders,
        BigDecimal totalRevenue,
        OffsetDateTime earliestPurchase,
        OffsetDateTime latestPurchase
) {}
