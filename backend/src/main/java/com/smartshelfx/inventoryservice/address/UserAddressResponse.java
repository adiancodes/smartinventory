package com.smartshelfx.inventoryservice.address;

public record UserAddressResponse(
        Long id,
        AddressType type,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        String country
) {}
