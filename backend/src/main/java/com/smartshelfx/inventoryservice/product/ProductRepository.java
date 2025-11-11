package com.smartshelfx.inventoryservice.product;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    List<ProductEntity> findAllByWarehouse_Id(Long warehouseId);

    Optional<ProductEntity> findByIdAndWarehouse_Id(Long id, Long warehouseId);

    @Query("select distinct p.category from ProductEntity p "
        + "where p.category is not null and trim(p.category) <> '' "
        + "order by lower(p.category)")
    List<String> findDistinctCategories();

    @Query("select distinct p.category from ProductEntity p "
        + "where p.category is not null and trim(p.category) <> '' "
        + "and p.warehouse.id = :warehouseId order by lower(p.category)")
    List<String> findDistinctCategoriesByWarehouseId(@Param("warehouseId") Long warehouseId);
}
