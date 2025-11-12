package com.smartshelfx.inventoryservice.analytics;

public record MonthlyQuantityTrendPoint(
        int year,
        int month,
        long restockedQuantity,
        long soldQuantity
) {
    public String label() {
        return String.format("%d-%02d", year, month);
    }
}
