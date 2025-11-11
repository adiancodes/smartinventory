package com.smartshelfx.inventoryservice.forecast;

import java.time.OffsetDateTime;

public interface WeeklyDemandRow {
    Long getProductId();
    String getProductName();
    String getProductSku();
    OffsetDateTime getWeekStart();
    Long getQuantity();
}
