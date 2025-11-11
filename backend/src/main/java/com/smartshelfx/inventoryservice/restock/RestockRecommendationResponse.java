package com.smartshelfx.inventoryservice.restock;

import java.math.BigDecimal;

public record RestockRecommendationResponse(
        Long productId,
        String productName,
        String productSku,
        String category,
        String vendor,
        Long warehouseId,
        String warehouseName,
        int currentStock,
        int reorderLevel,
        int maxStockLevel,
        boolean autoRestockEnabled,
        BigDecimal unitPrice,
        BigDecimal averageDailyDemand,
        BigDecimal projectedDaysUntilStockout,
        int suggestedReorderQuantity,
        String recommendationReason
) {
}
