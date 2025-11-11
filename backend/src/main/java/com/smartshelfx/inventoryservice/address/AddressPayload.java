package com.smartshelfx.inventoryservice.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressPayload(
        @NotBlank @Size(max = 160) String line1,
        @Size(max = 160) String line2,
        @NotBlank @Size(max = 120) String city,
        @NotBlank @Size(max = 120) String state,
        @NotBlank @Size(max = 20) String postalCode,
        @NotBlank @Size(max = 120) String country
) {}
