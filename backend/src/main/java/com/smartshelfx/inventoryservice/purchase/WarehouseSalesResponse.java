package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;

public record WarehouseSalesResponse(
        Long warehouseId,
        String warehouseName,
        String warehouseCode,
        long totalOrders,
        long totalItems,
        BigDecimal totalRevenue
) {}
