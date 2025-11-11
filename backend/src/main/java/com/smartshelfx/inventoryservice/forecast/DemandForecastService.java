package com.smartshelfx.inventoryservice.forecast;

import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.product.ProductRepository;
import com.smartshelfx.inventoryservice.purchase.PurchaseRepository;
import jakarta.transaction.Transactional;
import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DemandForecastService {

    private static final int HISTORY_POINTS = 6;

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;

    public DemandForecastService(PurchaseRepository purchaseRepository,
                                 ProductRepository productRepository) {
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<DemandForecastItemResponse> forecastForAllProducts() {
        List<ProductEntity> allProducts = productRepository.findAll();
        if (allProducts.isEmpty()) {
            return fallbackForecastItems();
        }

        List<ProductDemandAggregate> aggregates = purchaseRepository.aggregateProductDemandTotals();
        Map<Long, ProductDemandAggregate> aggregateByProduct = aggregates.stream()
                .collect(Collectors.toMap(ProductDemandAggregate::productId, Function.identity()));

        double maxQuantity = aggregates.stream()
                .mapToDouble(ProductDemandAggregate::totalQuantity)
                .filter(quantity -> quantity > 0)
                .max()
                .orElse(0d);

        OffsetDateTime baseWeekStart = OffsetDateTime.now(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .truncatedTo(ChronoUnit.DAYS);

        Map<Long, Double> demandScoreByProduct = new HashMap<>();
        List<DemandForecastItemResponse> responses = new ArrayList<>();

        for (ProductEntity product : allProducts) {
            ProductDemandAggregate aggregate = aggregateByProduct.get(product.getId());
            double totalSold = aggregate != null ? aggregate.totalQuantity() : 0d;
            demandScoreByProduct.put(product.getId(), totalSold);

            double relativeDemand = (maxQuantity > 0 && totalSold > 0) ? totalSold / maxQuantity : 0d;
            double weeklyRunRate = computeWeeklyRunRate(aggregate, totalSold);
            double baseline = weeklyRunRate > 0 ? weeklyRunRate : Math.max(1d, product.getReorderLevel() / 2d);
            double forecast = Math.max(1d, baseline * (1 + 0.75 * relativeDemand));
            forecast = Math.round(forecast * 10d) / 10d;

            int roundedForecast = (int) Math.ceil(forecast);
            int currentStock = product.getCurrentStock();
            int shortfall = Math.max(0, roundedForecast - currentStock);
            boolean atRisk = shortfall > 0;

            if (!atRisk && (currentStock - roundedForecast) <= product.getReorderLevel()) {
                atRisk = true;
            }

            int recommendedReorder = 0;
            String action;
            if (shortfall > 0) {
                recommendedReorder = shortfall;
                action = relativeDemand >= 0.7
                        ? "High demand - reorder " + shortfall + " units"
                        : "Reorder " + shortfall + " units";
            } else if (aggregate == null || totalSold == 0) {
                action = "No sales yet";
            } else if ((currentStock - roundedForecast) <= product.getReorderLevel()) {
                recommendedReorder = Math.max(0, product.getReorderLevel() + roundedForecast - currentStock);
                action = relativeDemand >= 0.7
                        ? "Top seller - keep buffer"
                        : "Top up safety stock";
            } else if (relativeDemand >= 0.8) {
                action = "Top demand product - monitor closely";
            } else if (relativeDemand >= 0.5) {
                action = "Healthy demand";
            } else {
                action = "Sufficient";
            }

            List<DemandForecastSeriesPoint> historyPoints = buildDemandHistory(baseWeekStart, baseline, relativeDemand);

            responses.add(new DemandForecastItemResponse(
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    currentStock,
                    product.getReorderLevel(),
                    forecast,
                    atRisk,
                    recommendedReorder,
                    action,
                    historyPoints
            ));
        }

        responses.sort(Comparator
                .comparing((DemandForecastItemResponse item) -> demandScoreByProduct.getOrDefault(item.productId(), 0d))
                .reversed()
                .thenComparing(DemandForecastItemResponse::forecastQuantity, Comparator.reverseOrder())
                .thenComparing(DemandForecastItemResponse::productName));

        return responses;
    }

    private double computeWeeklyRunRate(ProductDemandAggregate aggregate, double totalSold) {
        if (aggregate == null || totalSold <= 0) {
            return 0d;
        }
        OffsetDateTime start = aggregate.earliestPurchase();
        OffsetDateTime end = aggregate.latestPurchase();
        if (start == null || end == null) {
            return totalSold;
        }
        long days = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
        double weeks = Math.max(1d, days / 7d);
        return totalSold / weeks;
    }

    private List<DemandForecastSeriesPoint> buildDemandHistory(OffsetDateTime baseWeekStart,
                                                                double baseline,
                                                                double relativeDemand) {
        List<DemandForecastSeriesPoint> history = new ArrayList<>(HISTORY_POINTS);
        for (int offset = HISTORY_POINTS; offset >= 1; offset--) {
            OffsetDateTime weekStart = baseWeekStart.minusWeeks(offset);
            double progress = (HISTORY_POINTS - offset) / (double) HISTORY_POINTS;
            double trend = baseline * relativeDemand * 0.6 * progress;
            double seasonal = Math.sin(offset) * baseline * 0.12;
            double value = Math.max(1d, baseline + trend + seasonal);
            history.add(new DemandForecastSeriesPoint(weekStart, Math.round(value)));
        }
        return history;
    }

    private List<DemandForecastItemResponse> fallbackForecastItems() {
        OffsetDateTime baseWeekStart = OffsetDateTime.now(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .truncatedTo(ChronoUnit.DAYS);

    record SampleProduct(long id, String name, String sku, int stock, int reorder, double forecast, boolean atRisk,
                 int reorderSuggestion, double relativeDemand) {}

    List<SampleProduct> templates = List.of(
        new SampleProduct(-1L, "Alpha Widgets", "SKU-ALPHA", 42, 15, 32.5, false, 0, 0.9),
        new SampleProduct(-2L, "Beta Casing", "SKU-BETA", 8, 12, 18.0, true, 10, 0.7),
        new SampleProduct(-3L, "Gamma Sensors", "SKU-GAMMA", 5, 8, 12.0, true, 8, 0.5)
        );

        List<DemandForecastItemResponse> samples = new ArrayList<>();
        for (SampleProduct template : templates) {
            List<DemandForecastSeriesPoint> historyPoints = new ArrayList<>(HISTORY_POINTS);
            double baseline = Math.max(6d, template.forecast * 0.6);
            for (int offset = HISTORY_POINTS; offset >= 1; offset--) {
                OffsetDateTime weekStart = baseWeekStart.minusWeeks(offset);
                double progress = (HISTORY_POINTS - offset) / (double) HISTORY_POINTS;
                double trend = baseline * template.relativeDemand * 0.6 * progress;
                double seasonal = Math.sin(offset) * baseline * 0.12;
                double value = Math.max(1d, baseline + trend + seasonal);
                historyPoints.add(new DemandForecastSeriesPoint(weekStart, Math.round(value)));
            }

        samples.add(new DemandForecastItemResponse(
            template.id,
                    template.name,
                    template.sku,
                    template.stock,
                    template.reorder,
                    template.forecast,
                    template.atRisk,
                    template.reorderSuggestion,
                    template.atRisk ? "High demand - reorder " + template.reorderSuggestion + " units" : "Sufficient",
                    historyPoints
            ));
        }

        return samples;
    }
}
