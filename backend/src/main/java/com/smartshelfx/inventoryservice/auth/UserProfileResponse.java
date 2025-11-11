package com.smartshelfx.inventoryservice.auth;

public record UserProfileResponse(
        Long id,
        String fullName,
        String email,
        String companyName,
        String contactNumber,
        String role,
        Long warehouseId,
        String warehouseName,
        String warehouseCode
) {}
