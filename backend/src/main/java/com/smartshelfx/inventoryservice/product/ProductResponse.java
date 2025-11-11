package com.smartshelfx.inventoryservice.product;

import java.time.OffsetDateTime;
import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String sku,
        String category,
        String vendor,
        int reorderLevel,
        int maxStockLevel,
        int currentStock,
        boolean lowStock,
        boolean autoRestockEnabled,
        BigDecimal price,
        BigDecimal totalValue,
        Long warehouseId,
        String warehouseName,
        String warehouseCode,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
