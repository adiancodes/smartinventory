package com.smartshelfx.inventoryservice.restock;

import com.smartshelfx.inventoryservice.forecast.ProductDemandAggregate;
import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.product.ProductRepository;
import com.smartshelfx.inventoryservice.product.StockStatus;
import com.smartshelfx.inventoryservice.purchase.PurchaseRepository;
import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class RestockRecommendationService {

    private static final BigDecimal DEFAULT_FORECAST_WINDOW_DAYS = BigDecimal.valueOf(30);
    private static final BigDecimal MINIMUM_DAILY_DEMAND = BigDecimal.valueOf(0.1);
    private static final BigDecimal DAYS_UNTIL_STOCKOUT_THRESHOLD = BigDecimal.valueOf(7);

    private final ProductRepository productRepository;
    private final PurchaseRepository purchaseRepository;

    public RestockRecommendationService(ProductRepository productRepository,
                                        PurchaseRepository purchaseRepository) {
        this.productRepository = productRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<RestockRecommendationResponse> recommend(SecurityUserDetails currentUser,
                                                         Optional<Long> requestedWarehouseId,
                                                         Optional<String> category,
                                                         Optional<Boolean> autoRestockOnly,
                                                         Optional<StockStatus> stockStatusFilter) {
        boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
        boolean isManager = hasRole(currentUser, RoleName.MANAGER);

        List<ProductEntity> candidateProducts;
        if (isAdmin) {
            candidateProducts = requestedWarehouseId
                    .map(productRepository::findAllByWarehouse_Id)
                    .orElseGet(productRepository::findAll);
        } else if (isManager) {
            Long warehouseId = ensureWarehouseAssigned(currentUser);
            if (requestedWarehouseId.isPresent() && !requestedWarehouseId.get().equals(warehouseId)) {
                throw new IllegalArgumentException("Managers can only access their own warehouse inventory");
            }
            candidateProducts = productRepository.findAllByWarehouse_Id(warehouseId);
        } else {
            throw new IllegalArgumentException("Restock recommendations are restricted to administrators and managers");
        }

        Predicate<ProductEntity> categoryPredicate = product -> category
                .filter(StringUtils::hasText)
                .map(requestedCategory -> matchesIgnoreCase(product.getCategory(), requestedCategory))
                .orElse(true);

        Predicate<ProductEntity> autoRestockPredicate = product -> autoRestockOnly
                .map(Boolean::booleanValue)
                .map(flag -> !flag || product.isAutoRestockEnabled())
                .orElse(true);

        Predicate<ProductEntity> stockStatusPredicate = product -> stockStatusFilter
                .map(status -> switch (status) {
                    case OUT_OF_STOCK -> product.getCurrentStock() == 0;
                    case LOW_STOCK -> product.getCurrentStock() > 0
                            && product.getCurrentStock() <= product.getReorderLevel();
                    case IN_STOCK -> product.getCurrentStock() > product.getReorderLevel();
                })
                .orElse(true);

        List<ProductEntity> filteredProducts = candidateProducts.stream()
                .filter(categoryPredicate)
                .filter(autoRestockPredicate)
                .filter(stockStatusPredicate)
                .collect(Collectors.toList());

        if (filteredProducts.isEmpty()) {
            return List.of();
        }

        Map<Long, ProductDemandAggregate> demandByProductId = loadDemandAggregates(requestedWarehouseId);

        List<RestockRecommendationResponse> recommendations = new ArrayList<>();
        for (ProductEntity product : filteredProducts) {
            ProductDemandAggregate demandAggregate = demandByProductId.get(product.getId());
            BigDecimal dailyDemand = computeAverageDailyDemand(demandAggregate);
            BigDecimal daysUntilStockout = computeDaysUntilStockout(product.getCurrentStock(), dailyDemand);
            int suggestedQuantity = computeSuggestedQuantity(product, dailyDemand);
            if (suggestedQuantity <= 0) {
                continue;
            }

            boolean belowReorder = product.getCurrentStock() <= product.getReorderLevel();
            boolean nearStockout = daysUntilStockout.compareTo(DAYS_UNTIL_STOCKOUT_THRESHOLD) <= 0;
            boolean autoRestock = product.isAutoRestockEnabled();

            if (!belowReorder && !nearStockout && !autoRestock) {
                continue;
            }

            String reason = buildReason(belowReorder, nearStockout, autoRestock);

            recommendations.add(new RestockRecommendationResponse(
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    product.getCategory(),
                    product.getVendor(),
                    product.getWarehouse().getId(),
                    product.getWarehouse().getName(),
                    product.getCurrentStock(),
                    product.getReorderLevel(),
                    resolveMaxStockLevel(product),
                    product.isAutoRestockEnabled(),
            product.getPrice(),
                    dailyDemand,
                    daysUntilStockout,
                    suggestedQuantity,
                    reason
            ));
        }

        recommendations.sort(Comparator
                .comparing(RestockRecommendationResponse::projectedDaysUntilStockout)
                .thenComparing(RestockRecommendationResponse::suggestedReorderQuantity, Comparator.reverseOrder()));

        return recommendations;
    }

    private Map<Long, ProductDemandAggregate> loadDemandAggregates(Optional<Long> warehouseId) {
        List<ProductDemandAggregate> aggregates = warehouseId
                .map(purchaseRepository::aggregateProductDemandTotalsByWarehouse)
                .orElseGet(purchaseRepository::aggregateProductDemandTotals);
        return aggregates.stream().collect(Collectors.toMap(ProductDemandAggregate::productId, aggregate -> aggregate));
    }

    private BigDecimal computeAverageDailyDemand(ProductDemandAggregate aggregate) {
        if (aggregate == null || aggregate.totalQuantity() <= 0) {
            return MINIMUM_DAILY_DEMAND;
        }
        OffsetDateTime start = aggregate.earliestPurchase();
        OffsetDateTime end = aggregate.latestPurchase();
        if (start == null || end == null) {
            return MINIMUM_DAILY_DEMAND;
        }
        long days = Math.max(1, Duration.between(start, end).toDays());
        BigDecimal span = BigDecimal.valueOf(days).max(DEFAULT_FORECAST_WINDOW_DAYS);
        BigDecimal totalQuantity = BigDecimal.valueOf(aggregate.totalQuantity());
        BigDecimal rawAverage = totalQuantity.divide(span, 4, RoundingMode.HALF_UP);
        return rawAverage.max(MINIMUM_DAILY_DEMAND);
    }

    private BigDecimal computeDaysUntilStockout(int currentStock, BigDecimal dailyDemand) {
        if (currentStock <= 0) {
            return BigDecimal.ZERO;
        }
        if (dailyDemand.compareTo(MINIMUM_DAILY_DEMAND) <= 0) {
            return BigDecimal.valueOf(90);
        }
        return BigDecimal.valueOf(currentStock)
                .divide(dailyDemand, 2, RoundingMode.HALF_UP);
    }

    private int computeSuggestedQuantity(ProductEntity product, BigDecimal dailyDemand) {
        int targetLevel = resolveMaxStockLevel(product);
        int currentStock = product.getCurrentStock();
        int reorderLevel = product.getReorderLevel();

        BigDecimal fourteenDayDemand = dailyDemand.multiply(BigDecimal.valueOf(14));
        int demandCoverTarget = fourteenDayDemand.setScale(0, RoundingMode.CEILING).intValue();
        int baselineTarget = Math.max(targetLevel, reorderLevel + demandCoverTarget);
        return Math.max(0, baselineTarget - currentStock);
    }

    private int resolveMaxStockLevel(ProductEntity product) {
        int maxLevel = product.getMaxStockLevel();
        if (maxLevel > 0) {
            return maxLevel;
        }
        int reorderLevel = product.getReorderLevel();
        return reorderLevel > 0 ? reorderLevel * 2 : 50;
    }

    private String buildReason(boolean belowReorder, boolean nearStockout, boolean autoRestock) {
        List<String> reasons = new ArrayList<>();
        if (belowReorder) {
            reasons.add("Below reorder level");
        }
        if (nearStockout) {
            reasons.add("Projected stockout within a week");
        }
        if (autoRestock) {
            reasons.add("Auto-restock enabled");
        }
        return String.join(", ", reasons);
    }

    private boolean matchesIgnoreCase(String source, String target) {
        if (!StringUtils.hasText(source)) {
            return false;
        }
        return source.equalsIgnoreCase(target.trim());
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
}
