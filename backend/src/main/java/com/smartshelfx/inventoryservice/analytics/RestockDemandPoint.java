package com.smartshelfx.inventoryservice.analytics;

public record RestockDemandPoint(
        Long productId,
        String productName,
        String productSku,
        long restockedQuantity,
        long soldQuantity
) {
}
