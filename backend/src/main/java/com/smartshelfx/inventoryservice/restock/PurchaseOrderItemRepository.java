package com.smartshelfx.inventoryservice.restock;

import com.smartshelfx.inventoryservice.analytics.TopRestockedProjection;
import com.smartshelfx.inventoryservice.analytics.ProductRestockAggregate;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItemEntity, Long> {

    @Query("""
            select new com.smartshelfx.inventoryservice.analytics.TopRestockedProjection(
                poi.product.id,
                poi.productName,
                poi.productSku,
                coalesce(sum(poi.quantity), 0),
                count(distinct poi.purchaseOrder.id)
            )
            from PurchaseOrderItemEntity poi
            where (:warehouseId is null or poi.purchaseOrder.warehouse.id = :warehouseId)
              and poi.purchaseOrder.createdAt between :start and :end
            group by poi.product.id, poi.productName, poi.productSku
            order by sum(poi.quantity) desc
            """)
    List<TopRestockedProjection> topRestockedBetween(@Param("warehouseId") Long warehouseId,
                                                     @Param("start") OffsetDateTime start,
                                                     @Param("end") OffsetDateTime end);

    @Query("""
            select new com.smartshelfx.inventoryservice.analytics.ProductRestockAggregate(
                poi.product.id,
                poi.productName,
                poi.productSku,
                coalesce(sum(poi.quantity), 0)
            )
            from PurchaseOrderItemEntity poi
            where (:warehouseId is null or poi.purchaseOrder.warehouse.id = :warehouseId)
              and poi.purchaseOrder.createdAt between :start and :end
            group by poi.product.id, poi.productName, poi.productSku
            """)
    List<ProductRestockAggregate> aggregateRestockByProduct(@Param("warehouseId") Long warehouseId,
                                                            @Param("start") OffsetDateTime start,
                                                            @Param("end") OffsetDateTime end);
}
