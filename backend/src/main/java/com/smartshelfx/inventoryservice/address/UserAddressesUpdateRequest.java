package com.smartshelfx.inventoryservice.address;

import jakarta.validation.Valid;

public record UserAddressesUpdateRequest(
        @Valid AddressPayload delivery,
        @Valid AddressPayload billing
) {}
