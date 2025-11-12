package com.smartshelfx.inventoryservice.analytics;

public record InventoryStatusSummary(
        long totalProducts,
        long totalUnits,
        long lowStockProducts,
        long outOfStockProducts,
        long autoRestockEnabledProducts
) {
}
