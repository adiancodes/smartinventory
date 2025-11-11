package com.smartshelfx.inventoryservice.auth;

public record ManagerSummaryResponse(
        Long id,
        String fullName,
        String email,
        String warehouseName,
        String warehouseCode
) {}
