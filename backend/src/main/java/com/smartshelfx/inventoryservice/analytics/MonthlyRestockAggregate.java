package com.smartshelfx.inventoryservice.analytics;

import java.math.BigDecimal;

public record MonthlyRestockAggregate(
        int year,
        int month,
        BigDecimal totalAmount,
        long totalQuantity
) {
}
