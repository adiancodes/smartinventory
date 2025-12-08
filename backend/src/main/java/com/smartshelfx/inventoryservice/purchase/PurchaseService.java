package com.smartshelfx.inventoryservice.purchase;

import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.product.ProductRepository;
import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.user.UserRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PurchaseResponse purchaseProduct(PurchaseRequest request, SecurityUserDetails currentUser) {
        if (!RoleName.USER.name().equals(currentUser.role())) {
            throw new IllegalArgumentException("Only end users can purchase products");
        }

        UserEntity user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ProductEntity product = productRepository.findById(request.productId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (product.getCurrentStock() < request.quantity()) {
            throw new IllegalArgumentException("Insufficient stock for this product");
        }

        product.setCurrentStock(product.getCurrentStock() - request.quantity());
        productRepository.save(product);

        BigDecimal unitPrice = product.getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));

        PurchaseEntity purchase = new PurchaseEntity();
        purchase.setUser(user);
        purchase.setProduct(product);
        purchase.setWarehouse(product.getWarehouse());
        purchase.setQuantity(request.quantity());
        purchase.setUnitPrice(unitPrice);
        purchase.setTotalPrice(totalPrice);
        purchase.setProductName(product.getName());
        purchase.setProductSku(product.getSku());
        purchase.setWarehouseName(product.getWarehouse().getName());
        purchase.setWarehouseCode(product.getWarehouse().getLocationCode());

        PurchaseEntity saved = purchaseRepository.save(purchase);
        return toResponse(saved);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public UserPurchaseHistoryResponse historyForUser(SecurityUserDetails currentUser) {
        List<PurchaseEntity> purchases = purchaseRepository.findAllByUser_IdOrderByPurchasedAtDesc(currentUser.id());
        BigDecimal totalSpend = purchases.stream()
                .map(PurchaseEntity::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<UserPurchaseItemResponse> items = purchases.stream()
                .map(PurchaseService::toItemResponse)
                .toList();
        return new UserPurchaseHistoryResponse(items, totalSpend);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public SalesSummaryResponse adminSummary() {
        long totalOrders = purchaseRepository.count();
    Long totalItemsResult = purchaseRepository.sumTotalQuantity();
    BigDecimal totalRevenue = purchaseRepository.sumTotalRevenue();
    long totalItems = totalItemsResult != null ? totalItemsResult : 0L;
    BigDecimal revenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
    return new SalesSummaryResponse(totalOrders, totalItems, revenue);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<WarehouseSalesResponse> adminSummaryByWarehouse() {
        return purchaseRepository.aggregateSalesByWarehouse();
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<WarehouseProductSalesResponse> adminProductSalesByWarehouse(Long warehouseId) {
        if (warehouseId == null) {
            throw new IllegalArgumentException("Warehouse id must be provided");
        }
        return purchaseRepository.aggregateProductSalesByWarehouse(warehouseId);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public SalesSummaryResponse managerSummary(SecurityUserDetails currentUser) {
        Long warehouseId = currentUser.warehouseId();
        if (warehouseId == null) {
            throw new IllegalArgumentException("Manager is not assigned to a warehouse");
        }
        long totalOrders = purchaseRepository.countByWarehouse_Id(warehouseId);
        Long totalItemsResult = purchaseRepository.sumTotalQuantityByWarehouse(warehouseId);
        BigDecimal totalRevenue = purchaseRepository.sumTotalRevenueByWarehouse(warehouseId);
        long totalItems = totalItemsResult != null ? totalItemsResult : 0L;
        BigDecimal revenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        return new SalesSummaryResponse(totalOrders, totalItems, revenue);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public WarehousePurchaseHistoryResponse managerPurchaseHistory(SecurityUserDetails currentUser) {
        Long warehouseId = currentUser.warehouseId();
        if (warehouseId == null) {
            throw new IllegalArgumentException("Manager is not assigned to a warehouse");
        }

        List<PurchaseEntity> purchases = purchaseRepository.findTop50ByWarehouse_IdOrderByPurchasedAtDesc(warehouseId);
        long totalOrders = purchaseRepository.countByWarehouse_Id(warehouseId);
        Long totalItemsResult = purchaseRepository.sumTotalQuantityByWarehouse(warehouseId);
        BigDecimal totalRevenue = purchaseRepository.sumTotalRevenueByWarehouse(warehouseId);
        long totalItems = totalItemsResult != null ? totalItemsResult : 0L;
        BigDecimal revenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;

        List<WarehousePurchaseItemResponse> items = purchases.stream()
                .map(PurchaseService::toWarehouseItemResponse)
                .toList();

        return new WarehousePurchaseHistoryResponse(items, totalOrders, totalItems, revenue);
    }

    private static PurchaseResponse toResponse(PurchaseEntity entity) {
        return new PurchaseResponse(
                entity.getId(),
                entity.getProduct().getId(),
                entity.getProductName(),
                entity.getProductSku(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice(),
                entity.getPurchasedAt(),
                entity.getWarehouseName(),
                entity.getWarehouseCode()
        );
    }

    private static UserPurchaseItemResponse toItemResponse(PurchaseEntity entity) {
        return new UserPurchaseItemResponse(
                entity.getId(),
                entity.getProduct().getId(),
                entity.getProductName(),
                entity.getProductSku(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice(),
                entity.getPurchasedAt(),
                entity.getWarehouseName(),
                entity.getWarehouseCode()
        );
    }

    private static WarehousePurchaseItemResponse toWarehouseItemResponse(PurchaseEntity entity) {
        return new WarehousePurchaseItemResponse(
                entity.getId(),
                entity.getProduct().getId(),
                entity.getProductName(),
                entity.getProductSku(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice(),
                entity.getPurchasedAt(),
                entity.getUser().getFullName(),
                entity.getUser().getOfficialEmail()
        );
    }
}
