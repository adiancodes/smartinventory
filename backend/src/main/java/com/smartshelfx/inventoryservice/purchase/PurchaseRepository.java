package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseRepository extends JpaRepository<PurchaseEntity, Long> {

    List<PurchaseEntity> findAllByUser_IdOrderByPurchasedAtDesc(Long userId);

    long countByWarehouse_Id(Long warehouseId);

    @Query("select coalesce(sum(p.totalPrice), 0) from PurchaseEntity p")
    BigDecimal sumTotalRevenue();

    @Query("select coalesce(sum(p.totalPrice), 0) from PurchaseEntity p where p.warehouse.id = :warehouseId")
    BigDecimal sumTotalRevenueByWarehouse(@Param("warehouseId") Long warehouseId);

    @Query("select coalesce(sum(p.quantity), 0) from PurchaseEntity p")
    Long sumTotalQuantity();

    @Query("select coalesce(sum(p.quantity), 0) from PurchaseEntity p where p.warehouse.id = :warehouseId")
    Long sumTotalQuantityByWarehouse(@Param("warehouseId") Long warehouseId);

    @Query("""
            select new com.smartshelfx.inventoryservice.purchase.WarehouseSalesResponse(
                p.warehouse.id,
                p.warehouse.name,
                p.warehouse.locationCode,
                count(p.id),
                coalesce(sum(p.quantity), 0),
                coalesce(sum(p.totalPrice), 0)
            )
            from PurchaseEntity p
            group by p.warehouse.id, p.warehouse.name, p.warehouse.locationCode
            order by sum(p.totalPrice) desc
            """)
    List<WarehouseSalesResponse> aggregateSalesByWarehouse();

    @Query("""
            select new com.smartshelfx.inventoryservice.purchase.WarehouseProductSalesResponse(
                p.product.id,
                p.product.name,
                p.product.sku,
                count(p.id),
                coalesce(sum(p.quantity), 0),
                coalesce(sum(p.totalPrice), 0)
            )
            from PurchaseEntity p
            where p.warehouse.id = :warehouseId
            group by p.product.id, p.product.name, p.product.sku
            order by sum(p.totalPrice) desc
            """)
    List<WarehouseProductSalesResponse> aggregateProductSalesByWarehouse(@Param("warehouseId") Long warehouseId);
}
