package com.smartshelfx.inventoryservice.analytics;

public record ProductRestockAggregate(
        Long productId,
        String productName,
        String productSku,
        long totalQuantity
) {
}
