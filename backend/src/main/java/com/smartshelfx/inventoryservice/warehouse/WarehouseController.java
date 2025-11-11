package com.smartshelfx.inventoryservice.warehouse;

import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.product.ProductRepository;
import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.user.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/warehouses")
public class WarehouseController {

    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WarehouseController(WarehouseRepository warehouseRepository,
                               UserRepository userRepository,
                               ProductRepository productRepository) {
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<WarehouseSummaryResponse> listWarehouses(@AuthenticationPrincipal SecurityUserDetails currentUser) {
        if (currentUser.role().equals(RoleName.ADMIN.name())) {
            return warehouseRepository.findAllByActiveTrueOrderByNameAsc().stream()
                    .map(WarehouseSummaryResponse::fromEntity)
                    .toList();
        }

        if (currentUser.role().equals(RoleName.MANAGER.name())) {
            Long warehouseId = currentUser.warehouseId();
            if (warehouseId == null) {
                throw new IllegalArgumentException("No warehouse assigned to current user");
            }
            WarehouseEntity warehouse = warehouseRepository.findById(warehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
            return List.of(WarehouseSummaryResponse.fromEntity(warehouse));
        }

        throw new IllegalArgumentException("Unauthorized role for warehouse listing");
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ManagerWarehouseDetailResponse managerWarehouseDetail(@PathVariable Long managerId) {
        UserEntity manager = userRepository.findById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));

        if (manager.getRole() == null || manager.getRole().getName() != RoleName.MANAGER) {
            throw new IllegalArgumentException("User is not a manager");
        }

        WarehouseEntity warehouse = manager.getWarehouse();
        if (warehouse == null) {
            throw new IllegalArgumentException("Manager is not assigned to a warehouse");
        }

        List<ProductEntity> warehouseProducts = productRepository.findAllByWarehouse_Id(warehouse.getId());
        int totalProducts = warehouseProducts.size();
        BigDecimal totalValue = warehouseProducts.stream()
                .map(product -> product.getPrice().multiply(BigDecimal.valueOf(product.getCurrentStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long lowStockCount = warehouseProducts.stream()
                .filter(product -> product.getCurrentStock() > 0 && product.getCurrentStock() <= product.getReorderLevel())
                .count();

        return new ManagerWarehouseDetailResponse(
                manager.getId(),
                manager.getFullName(),
                manager.getOfficialEmail(),
                warehouse.getName(),
                warehouse.getLocationCode(),
                warehouse.getLocationCode(),
                totalProducts,
                totalValue,
                (int) lowStockCount
        );
    }
}
