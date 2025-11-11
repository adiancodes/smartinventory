package com.smartshelfx.inventoryservice.warehouse;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<WarehouseEntity, Long> {
    Optional<WarehouseEntity> findByLocationCode(String locationCode);
    List<WarehouseEntity> findAllByActiveTrueOrderByNameAsc();
}
