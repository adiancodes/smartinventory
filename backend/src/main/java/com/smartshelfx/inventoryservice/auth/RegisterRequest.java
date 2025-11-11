package com.smartshelfx.inventoryservice.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 120) String companyName,
        @NotBlank @Email String officialEmail,
        @Pattern(regexp = "^$|^[0-9+\\- ]{7,20}$", message = "Invalid contact number") String contactNumber,
        @NotBlank @Size(min = 8, max = 64) String password,
        @NotBlank String role,
        String warehouseLocationCode,
        @Size(max = 120) String warehouseLocationName
) {}
