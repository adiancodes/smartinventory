package com.smartshelfx.inventoryservice.address;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAddressRepository extends JpaRepository<UserAddressEntity, Long> {
    Optional<UserAddressEntity> findByUser_IdAndType(Long userId, AddressType type);
}
