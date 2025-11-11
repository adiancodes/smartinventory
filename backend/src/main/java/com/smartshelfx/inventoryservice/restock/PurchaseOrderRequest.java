package com.smartshelfx.inventoryservice.restock;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;

public record PurchaseOrderRequest(
        @NotBlank @Size(max = 150) String vendorName,
        @Email @Size(max = 150) String vendorEmail,
        @Size(max = 30) String vendorPhone,
        @Size(max = 30) String vendorContactPreference,
        @Size(max = 250) String notes,
        @NotNull Long warehouseId,
        @FutureOrPresent OffsetDateTime expectedDeliveryDate,
        @NotNull @Valid List<PurchaseOrderItemRequest> items,
        boolean sendEmail,
        boolean sendSms
) {
}
