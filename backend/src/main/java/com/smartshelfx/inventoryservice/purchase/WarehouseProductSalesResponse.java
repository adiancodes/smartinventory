package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;

public record WarehouseProductSalesResponse(
        Long productId,
        String productName,
        String productSku,
        long totalOrders,
        long totalQuantity,
        BigDecimal totalRevenue
) {}
