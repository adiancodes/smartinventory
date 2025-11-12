package com.smartshelfx.inventoryservice.analytics;

import java.time.OffsetDateTime;
import java.util.List;

public record AnalyticsDashboardResponse(
        InventoryStatusSummary inventoryStatus,
        List<StatusSlice> statusDistribution,
        List<MonthlyQuantityTrendPoint> monthlyQuantityTrend,
        List<MonthlyFinancialPoint> monthlyFinancials,
        List<TopRestockedItem> topRestockedItems,
        List<RestockDemandPoint> restockDemandComparison,
        String scopeLabel,
        OffsetDateTime generatedAt
) {
}
