package com.smartshelfx.inventoryservice.analytics;

import java.math.BigDecimal;

public record MonthlyFinancialPoint(
        int year,
        int month,
        BigDecimal restockSpend,
        BigDecimal salesRevenue
) {
    public String label() {
        return String.format("%d-%02d", year, month);
    }
}
