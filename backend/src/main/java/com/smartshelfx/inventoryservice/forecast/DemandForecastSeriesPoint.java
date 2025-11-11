package com.smartshelfx.inventoryservice.forecast;

import java.time.OffsetDateTime;

public record DemandForecastSeriesPoint(
        OffsetDateTime weekStart,
        long quantity
) {}
