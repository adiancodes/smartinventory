package com.smartshelfx.inventoryservice.restock;

import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "purchase_orders", uniqueConstraints = {
        @UniqueConstraint(name = "uk_purchase_orders_reference", columnNames = "reference")
})
@Getter
@Setter
@NoArgsConstructor
public class PurchaseOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    @Column(nullable = false, length = 150)
    private String vendorName;

    @Column(length = 150)
    private String vendorEmail;

    @Column(length = 30)
    private String vendorPhone;

    @Column(length = 30)
    private String vendorContactPreference;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    @Column(length = 250)
    private String notes;

    private OffsetDateTime submittedAt;

    private OffsetDateTime expectedDeliveryDate;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private WarehouseEntity warehouse;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderItemEntity> items = new ArrayList<>();

    public void addItem(PurchaseOrderItemEntity item) {
        items.add(item);
        item.setPurchaseOrder(this);
    }
}
