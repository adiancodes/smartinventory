package com.smartshelfx.inventoryservice.forecast;

import java.time.OffsetDateTime;

public record WeeklyProductDemand(
        Long productId,
        String productName,
        String productSku,
        OffsetDateTime weekStart,
        long quantity
) {}
