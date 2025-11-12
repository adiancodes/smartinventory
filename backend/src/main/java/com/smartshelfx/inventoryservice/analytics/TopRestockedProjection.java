package com.smartshelfx.inventoryservice.analytics;

public record TopRestockedProjection(
        Long productId,
        String productName,
        String productSku,
        long totalQuantity,
        long orderCount
) {
}
