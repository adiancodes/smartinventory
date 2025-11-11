package com.smartshelfx.inventoryservice.restock;

public record VendorNotificationResult(
        boolean emailDispatched,
        boolean smsDispatched,
        String failureMessage
) {
    public boolean hasFailure() {
        return failureMessage != null && !failureMessage.isBlank();
    }
}
