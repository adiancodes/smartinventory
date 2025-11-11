package com.smartshelfx.inventoryservice.restock;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
