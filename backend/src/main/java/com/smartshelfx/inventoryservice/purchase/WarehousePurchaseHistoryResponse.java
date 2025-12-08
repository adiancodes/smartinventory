package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;
import java.util.List;

public record WarehousePurchaseHistoryResponse(
        List<WarehousePurchaseItemResponse> purchases,
        long totalOrders,
        long totalItems,
        BigDecimal totalRevenue
) {
}
