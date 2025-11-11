package com.smartshelfx.inventoryservice.product;

import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public ProductService(ProductRepository productRepository, WarehouseRepository warehouseRepository) {
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional
    public ProductResponse create(ProductRequest request, SecurityUserDetails currentUser) {
        ensureSkuUnique(request.sku(), null);
        WarehouseEntity warehouse = resolveWarehouse(request.warehouseId(), currentUser);

        ProductEntity product = new ProductEntity();
        updateEntity(product, request, warehouse);
        ProductEntity saved = productRepository.save(product);
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request, SecurityUserDetails currentUser) {
        ProductEntity product = findManagedProduct(id, currentUser);
        ensureSkuUnique(request.sku(), product.getId());
        WarehouseEntity warehouse = determineWarehouseForUpdate(request.warehouseId(), product, currentUser);
        updateEntity(product, request, warehouse);
        return toResponse(product);
    }

    @Transactional
    public void delete(Long id, SecurityUserDetails currentUser) {
        ProductEntity product = findManagedProduct(id, currentUser);
        productRepository.delete(product);
    }

    @Transactional
    public void deleteAllByWarehouse(Long warehouseId) {
        List<ProductEntity> products = productRepository.findAllByWarehouse_Id(warehouseId);
        productRepository.deleteAll(products);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<ProductResponse> list(SecurityUserDetails currentUser,
                                      Optional<Long> requestedWarehouseId,
                                      Optional<String> category,
                                      Optional<String> vendor,
                                      Optional<StockStatus> stockStatus) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        List<ProductEntity> baseProducts;
        if (isAdmin) {
            if (requestedWarehouseId.isPresent()) {
                baseProducts = productRepository.findAllByWarehouse_Id(requestedWarehouseId.get());
            } else {
                baseProducts = productRepository.findAll();
            }
        } else if (isManager) {
            Long managerWarehouseId = ensureWarehouseAssigned(currentUser);
            if (requestedWarehouseId.isPresent() && !requestedWarehouseId.get().equals(managerWarehouseId)) {
                throw new IllegalArgumentException("Managers can only access their own warehouse inventory");
            }
            baseProducts = productRepository.findAllByWarehouse_Id(managerWarehouseId);
        } else {
            baseProducts = productRepository.findAll();
        }

        return baseProducts.stream()
                .filter(product -> category.map(value -> matchesIgnoreCase(product.getCategory(), value)).orElse(true))
                .filter(product -> vendor.map(value -> matchesIgnoreCase(product.getVendor(), value)).orElse(true))
                .filter(product -> stockStatus.map(status -> matchesStatus(product, status)).orElse(true))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void updateEntity(ProductEntity product, ProductRequest request, WarehouseEntity warehouse) {
        if (request.maxStockLevel() < request.reorderLevel()) {
            throw new IllegalArgumentException("Max stock level cannot be less than min stock level");
        }
        product.setName(request.name().trim());
        product.setSku(request.sku().trim().toUpperCase(Locale.ROOT));
        product.setCategory(request.category().trim());
        product.setVendor(request.vendor().trim());
        product.setReorderLevel(request.reorderLevel());
        product.setMaxStockLevel(request.maxStockLevel());
        product.setCurrentStock(request.currentStock());
        product.setPrice(request.price());
        product.setAutoRestockEnabled(Boolean.TRUE.equals(request.autoRestockEnabled()));
        product.setWarehouse(warehouse);
    }

    private WarehouseEntity resolveWarehouse(Long requestedWarehouseId, SecurityUserDetails currentUser) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        if (isAdmin) {
            if (requestedWarehouseId == null) {
                throw new IllegalArgumentException("Warehouse selection is required for new products");
            }
            return warehouseRepository.findById(requestedWarehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        }

        if (isManager) {
            Long warehouseId = ensureWarehouseAssigned(currentUser);
            if (requestedWarehouseId != null && !requestedWarehouseId.equals(warehouseId)) {
                throw new IllegalArgumentException("Managers cannot assign products to another warehouse");
            }
            return warehouseRepository.findById(warehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Manager warehouse not found"));
        }

        throw new IllegalArgumentException("Only administrators or managers can modify products");
    }

    private WarehouseEntity determineWarehouseForUpdate(Long requestedWarehouseId,
                                                         ProductEntity product,
                                                         SecurityUserDetails currentUser) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        if (isAdmin) {
            if (requestedWarehouseId == null) {
                return product.getWarehouse();
            }
            return warehouseRepository.findById(requestedWarehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        }

        if (isManager) {
            Long warehouseId = ensureWarehouseAssigned(currentUser);
            if (!product.getWarehouse().getId().equals(warehouseId)) {
                throw new IllegalArgumentException("Managers can only update products in their warehouse");
            }
            if (requestedWarehouseId != null && !requestedWarehouseId.equals(warehouseId)) {
                throw new IllegalArgumentException("Managers cannot move products to another warehouse");
            }
            return product.getWarehouse();
        }

        throw new IllegalArgumentException("Only administrators or managers can modify products");
    }

    private ProductEntity findManagedProduct(Long id, SecurityUserDetails currentUser) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        if (isAdmin) {
            return productRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        }

        if (isManager) {
            Long warehouseId = ensureWarehouseAssigned(currentUser);
            return productRepository.findByIdAndWarehouse_Id(id, warehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found in your warehouse"));
        }

        throw new IllegalArgumentException("Only administrators or managers can modify products");
    }

    private void ensureSkuUnique(String sku, Long currentProductId) {
        String normalizedSku = sku.trim().toUpperCase(Locale.ROOT);
        boolean exists = currentProductId == null
                ? productRepository.existsBySkuIgnoreCase(normalizedSku)
                : productRepository.existsBySkuIgnoreCaseAndIdNot(normalizedSku, currentProductId);
        if (exists) {
            throw new IllegalArgumentException("SKU already exists");
        }
    }

    private boolean matchesIgnoreCase(String source, String target) {
        if (!StringUtils.hasText(source)) {
            return false;
        }
        return source.equalsIgnoreCase(target.trim());
    }

    private boolean matchesStatus(ProductEntity product, StockStatus status) {
        return switch (status) {
            case OUT_OF_STOCK -> product.getCurrentStock() == 0;
            case LOW_STOCK -> product.getCurrentStock() > 0 && product.getCurrentStock() <= product.getReorderLevel();
            case IN_STOCK -> product.getCurrentStock() > product.getReorderLevel();
        };
    }

    private boolean hasRole(SecurityUserDetails userDetails, RoleName roleName) {
        return userDetails.role().equals(roleName.name());
    }

    private Long ensureWarehouseAssigned(SecurityUserDetails currentUser) {
        Long warehouseId = currentUser.warehouseId();
        if (warehouseId == null) {
            throw new IllegalArgumentException("No warehouse assigned to current user");
        }
        return warehouseId;
    }

    private ProductResponse toResponse(ProductEntity product) {
        boolean lowStock = product.getCurrentStock() == 0
                || product.getCurrentStock() <= product.getReorderLevel();
    BigDecimal totalValue = product.getPrice().multiply(BigDecimal.valueOf(product.getCurrentStock()));
    int maxStockLevel = product.getMaxStockLevel() > 0 ? product.getMaxStockLevel() : product.getReorderLevel();
    boolean autoRestockEnabled = product.isAutoRestockEnabled();
    return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getCategory(),
                product.getVendor(),
                product.getReorderLevel(),
        maxStockLevel,
                product.getCurrentStock(),
                lowStock,
        autoRestockEnabled,
        product.getPrice(),
        totalValue,
                product.getWarehouse().getId(),
                product.getWarehouse().getName(),
                product.getWarehouse().getLocationCode(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
