package com.smartshelfx.inventoryservice.analytics;

public record StatusSlice(
        String key,
        long productCount,
        long totalUnits
) {
}
