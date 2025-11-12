package com.smartshelfx.inventoryservice.analytics;

public record TopRestockedItem(
        Long productId,
        String productName,
        String productSku,
        long totalQuantity,
        long orderCount
) {
}
