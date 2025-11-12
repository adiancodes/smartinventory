package com.smartshelfx.inventoryservice.restock;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartshelfx.inventoryservice.analytics.MonthlyRestockAggregate;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrderEntity, Long> {

    @Query("""
            select distinct po from PurchaseOrderEntity po
            join fetch po.warehouse
            join fetch po.createdBy
            left join fetch po.items items
            left join fetch items.product
            where po.warehouse.id = :warehouseId
            order by po.createdAt desc
            """)
    List<PurchaseOrderEntity> findAllByWarehouseId(@Param("warehouseId") Long warehouseId);

    @Query("""
            select distinct po from PurchaseOrderEntity po
            join fetch po.warehouse
            join fetch po.createdBy
            left join fetch po.items items
            left join fetch items.product
            order by po.createdAt desc
            """)
    List<PurchaseOrderEntity> findAllWithDetails();

    boolean existsByReferenceIgnoreCase(String reference);

                @Query("""
                                                select new com.smartshelfx.inventoryservice.analytics.MonthlyRestockAggregate(
                                                                year(po.createdAt),
                                                                month(po.createdAt),
                                                                coalesce(sum(po.totalAmount), 0),
                                                                coalesce(sum(items.quantity), 0)
                                                )
                                                from PurchaseOrderEntity po
                                                left join po.items items
                                                where po.createdAt between :start and :end
                                                        and (:warehouseId is null or po.warehouse.id = :warehouseId)
                                                group by year(po.createdAt), month(po.createdAt)
                                                order by year(po.createdAt), month(po.createdAt)
                                                """)
                List<MonthlyRestockAggregate> aggregateMonthlyRestock(@Param("warehouseId") Long warehouseId,
                                                                                                                                                                                                                                        @Param("start") OffsetDateTime start,
                                                                                                                                                                                                                                        @Param("end") OffsetDateTime end);
}
