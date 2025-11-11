package com.smartshelfx.inventoryservice.warehouse;

public record WarehouseSummaryResponse(
        Long id,
        String name,
        String locationCode,
        boolean active
) {
    public static WarehouseSummaryResponse fromEntity(WarehouseEntity entity) {
        return new WarehouseSummaryResponse(entity.getId(), entity.getName(), entity.getLocationCode(), entity.isActive());
    }
}
