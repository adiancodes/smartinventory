package com.smartshelfx.inventoryservice.product;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    List<ProductEntity> findAllByWarehouse_Id(Long warehouseId);

    Optional<ProductEntity> findByIdAndWarehouse_Id(Long id, Long warehouseId);
}
