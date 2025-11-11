package com.smartshelfx.inventoryservice.purchase;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
        @NotNull Long productId,
        @Min(value = 1, message = "Quantity must be at least 1") int quantity
) {}
