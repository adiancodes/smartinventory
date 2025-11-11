package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;

public record SalesSummaryResponse(
        long totalOrders,
        long totalItems,
        BigDecimal totalRevenue
) {}
