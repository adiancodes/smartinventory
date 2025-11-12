package com.smartshelfx.inventoryservice.analytics;

public record ExportPayload(byte[] content, String filename) {
}
