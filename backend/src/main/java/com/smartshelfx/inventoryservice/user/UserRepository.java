package com.smartshelfx.inventoryservice.user;

import com.smartshelfx.inventoryservice.role.RoleName;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByOfficialEmail(String email);
    boolean existsByOfficialEmail(String email);
    List<UserEntity> findAllByRole_Name(RoleName role);
    List<UserEntity> findAllByWarehouse_Id(Long warehouseId);
}
