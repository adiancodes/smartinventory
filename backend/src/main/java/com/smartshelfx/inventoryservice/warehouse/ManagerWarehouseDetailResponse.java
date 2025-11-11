package com.smartshelfx.inventoryservice.warehouse;

import java.math.BigDecimal;

public record ManagerWarehouseDetailResponse(
        Long id,
        String fullName,
        String email,
        String warehouseName,
        String warehouseCode,
        String warehouseLocation,
        Integer totalProducts,
        BigDecimal totalValue,
        Integer lowStockCount
) {
}
