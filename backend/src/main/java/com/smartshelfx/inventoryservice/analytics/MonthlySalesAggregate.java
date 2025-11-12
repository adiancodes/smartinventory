package com.smartshelfx.inventoryservice.analytics;

import java.math.BigDecimal;

public record MonthlySalesAggregate(
        int year,
        int month,
        BigDecimal totalRevenue,
        long totalQuantity
) {
}
