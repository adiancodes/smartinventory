package com.smartshelfx.inventoryservice.purchase;

import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "purchases")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @ManyToOne(optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private WarehouseEntity warehouse;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false, length = 180)
    private String productName;

    @Column(nullable = false, length = 60)
    private String productSku;

    @Column(nullable = false, length = 120)
    private String warehouseName;

    @Column(nullable = false, length = 60)
    private String warehouseCode;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime purchasedAt;
}
