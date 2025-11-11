package com.smartshelfx.inventoryservice.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 60) String sku,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 120) String vendor,
        @NotNull @Min(0) Integer reorderLevel,
        @NotNull @Min(0) Integer maxStockLevel,
        @NotNull @Min(0) Integer currentStock,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal price,
        @NotNull Boolean autoRestockEnabled,
        Long warehouseId
) {
}
