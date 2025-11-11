package com.smartshelfx.inventoryservice.address;

public record UserAddressesResponse(
        UserAddressResponse delivery,
        UserAddressResponse billing
) {}
