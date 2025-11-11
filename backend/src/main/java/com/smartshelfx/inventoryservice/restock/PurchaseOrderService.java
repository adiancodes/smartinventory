package com.smartshelfx.inventoryservice.restock;

import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.product.ProductRepository;
import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.user.UserRepository;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final VendorNotificationService notificationService;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
                                ProductRepository productRepository,
                                WarehouseRepository warehouseRepository,
                                UserRepository userRepository,
                                VendorNotificationService notificationService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<PurchaseOrderResponse> list(SecurityUserDetails currentUser, Optional<Long> warehouseId) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        List<PurchaseOrderEntity> orders;
        if (isAdmin) {
            orders = warehouseId
                    .map(purchaseOrderRepository::findAllByWarehouseId)
                    .orElseGet(purchaseOrderRepository::findAllWithDetails);
        } else if (isManager) {
            Long managerWarehouseId = ensureWarehouseAssigned(currentUser);
            if (warehouseId.isPresent() && !warehouseId.get().equals(managerWarehouseId)) {
                throw new IllegalArgumentException("Managers can only view purchase orders for their warehouse");
            }
            orders = purchaseOrderRepository.findAllByWarehouseId(managerWarehouseId);
        } else {
            throw new IllegalArgumentException("Purchase orders are restricted to administrators and managers");
        }

        return orders.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public PurchaseOrderResponse create(SecurityUserDetails currentUser, PurchaseOrderRequest request) {
        validateItems(request.items());

        WarehouseEntity warehouse = resolveWarehouse(currentUser, request.warehouseId());
        UserEntity creator = resolveUser(currentUser.id());

        PurchaseOrderEntity order = new PurchaseOrderEntity();
        order.setReference(generateReference());
        order.setStatus(PurchaseOrderStatus.PENDING_VENDOR_APPROVAL);
        order.setVendorName(request.vendorName().trim());
        order.setVendorEmail(safeTrim(request.vendorEmail()));
        order.setVendorPhone(safeTrim(request.vendorPhone()));
        order.setVendorContactPreference(safeTrim(request.vendorContactPreference()));
        order.setNotes(safeTrim(request.notes()));
        order.setWarehouse(warehouse);
        order.setCreatedBy(creator);
        order.setExpectedDeliveryDate(request.expectedDeliveryDate());
        order.setSubmittedAt(OffsetDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemRequest : request.items()) {
            ProductEntity product = resolveProduct(warehouse.getId(), itemRequest.productId());
            PurchaseOrderItemEntity item = new PurchaseOrderItemEntity();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setProductSku(product.getSku());
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(itemRequest.unitPrice().setScale(2, RoundingMode.HALF_UP));
            BigDecimal lineTotal = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            item.setLineTotal(lineTotal);
            subtotal = subtotal.add(lineTotal);
            order.addItem(item);
        }

        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        order.setSubtotalAmount(subtotal);
        order.setTaxAmount(BigDecimal.ZERO);
        order.setShippingAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal);

        PurchaseOrderEntity saved = purchaseOrderRepository.save(order);

        VendorNotificationResult notificationResult = notificationService.dispatchPurchaseOrder(saved,
                new PurchaseOrderNotificationOptions(request.sendEmail(), request.sendSms()));

        if (notificationResult.emailDispatched() || notificationResult.smsDispatched()) {
            saved.setStatus(PurchaseOrderStatus.SENT_TO_VENDOR);
        }
        if (notificationResult.hasFailure()) {
            saved.setStatus(PurchaseOrderStatus.NOTIFICATION_FAILED);
            saved.setNotes(appendFailureNote(saved.getNotes(), notificationResult.failureMessage()));
        }

        PurchaseOrderEntity updated = purchaseOrderRepository.save(saved);
        return toResponse(updated);
    }

    private void validateItems(List<PurchaseOrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("At least one item is required for a purchase order");
        }
    }

    private WarehouseEntity resolveWarehouse(SecurityUserDetails currentUser, Long requestedWarehouseId) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        if (isAdmin) {
            return warehouseRepository.findById(requestedWarehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        }

        if (isManager) {
            Long managerWarehouseId = ensureWarehouseAssigned(currentUser);
            if (!managerWarehouseId.equals(requestedWarehouseId)) {
                throw new IllegalArgumentException("Managers can only create purchase orders for their warehouse");
            }
            return warehouseRepository.findById(managerWarehouseId)
                    .orElseThrow(() -> new IllegalArgumentException("Manager warehouse not found"));
        }

        throw new IllegalArgumentException("Purchase orders are restricted to administrators and managers");
    }

    private ProductEntity resolveProduct(Long warehouseId, Long productId) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (!product.getWarehouse().getId().equals(warehouseId)) {
            throw new IllegalArgumentException("Product does not belong to selected warehouse");
        }
        return product;
    }

    private UserEntity resolveUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private boolean hasRole(SecurityUserDetails currentUser, RoleName roleName) {
        return currentUser.role().equals(roleName.name());
    }

    private Long ensureWarehouseAssigned(SecurityUserDetails currentUser) {
        Long warehouseId = currentUser.warehouseId();
        if (warehouseId == null) {
            throw new IllegalArgumentException("No warehouse assigned to current user");
        }
        return warehouseId;
    }

    private String generateReference() {
        String candidate = "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        if (purchaseOrderRepository.existsByReferenceIgnoreCase(candidate)) {
            return generateReference();
        }
        return candidate;
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private PurchaseOrderResponse toResponse(PurchaseOrderEntity entity) {
        List<PurchaseOrderItemResponse> items = entity.getItems().stream()
                .map(item -> new PurchaseOrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProductName(),
                        item.getProductSku(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .collect(Collectors.toList());

        return new PurchaseOrderResponse(
                entity.getId(),
                entity.getReference(),
                entity.getStatus(),
                entity.getVendorName(),
                entity.getVendorEmail(),
                entity.getVendorPhone(),
                entity.getVendorContactPreference(),
                entity.getNotes(),
                entity.getWarehouse().getId(),
                entity.getWarehouse().getName(),
                entity.getCreatedBy().getId(),
                entity.getCreatedBy().getFullName(),
                entity.getExpectedDeliveryDate(),
                entity.getSubmittedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getSubtotalAmount(),
                entity.getTaxAmount(),
                entity.getShippingAmount(),
                entity.getTotalAmount(),
                items
        );
    }

    private String appendFailureNote(String existing, String failureMessage) {
        String message = "Notification failed: " + failureMessage;
        if (existing == null || existing.isBlank()) {
            return message;
        }
        return existing + " | " + message;
    }
}
