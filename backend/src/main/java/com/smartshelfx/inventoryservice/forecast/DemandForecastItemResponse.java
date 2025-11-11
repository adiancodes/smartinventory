package com.smartshelfx.inventoryservice.forecast;

import java.util.List;

public record DemandForecastItemResponse(
        Long productId,
        String productName,
        String productSku,
        int currentStock,
        int reorderLevel,
        double forecastQuantity,
        boolean atRisk,
        int recommendedReorder,
        String action,
        List<DemandForecastSeriesPoint> history
) {}
