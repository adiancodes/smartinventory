package com.smartshelfx.inventoryservice.analytics;

import com.smartshelfx.inventoryservice.product.ProductEntity;
import com.smartshelfx.inventoryservice.product.ProductRepository;
import com.smartshelfx.inventoryservice.purchase.PurchaseRepository;
import com.smartshelfx.inventoryservice.restock.PurchaseOrderItemRepository;
import com.smartshelfx.inventoryservice.restock.PurchaseOrderRepository;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseRepository;
import jakarta.transaction.Transactional;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private static final int MONTH_WINDOW = 6;

    private final ProductRepository productRepository;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final WarehouseRepository warehouseRepository;

    public AnalyticsService(ProductRepository productRepository,
                            PurchaseRepository purchaseRepository,
                            PurchaseOrderRepository purchaseOrderRepository,
                            PurchaseOrderItemRepository purchaseOrderItemRepository,
                            WarehouseRepository warehouseRepository) {
        this.productRepository = productRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public AnalyticsDashboardResponse buildDashboard(SecurityUserDetails currentUser, Long requestedWarehouseId) {
        Long warehouseScope = resolveWarehouseScope(currentUser, requestedWarehouseId);
        ZoneId zone = ZonedDateTime.now().getZone();
        YearMonth currentMonth = YearMonth.now();
        YearMonth startMonth = currentMonth.minusMonths(MONTH_WINDOW - 1L);
        OffsetDateTime rangeStart = startMonth.atDay(1).atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime rangeEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay(zone).toOffsetDateTime();

        List<ProductEntity> products = fetchProductsByScope(warehouseScope);
        InventoryStatusSummary inventoryStatus = computeInventoryStatus(products);
        List<StatusSlice> statusDistribution = computeStatusDistribution(products);

        Map<YearMonth, MonthlyRestockAggregate> restockByMonth = purchaseOrderRepository
                .aggregateMonthlyRestock(warehouseScope, rangeStart, rangeEnd)
                .stream()
                .collect(Collectors.toMap(
                        aggregate -> YearMonth.of(aggregate.year(), aggregate.month()),
                        aggregate -> aggregate
                ));

        Map<YearMonth, MonthlySalesAggregate> salesByMonth = purchaseRepository
                .aggregateMonthlySales(warehouseScope, rangeStart, rangeEnd)
                .stream()
                .collect(Collectors.toMap(
                        aggregate -> YearMonth.of(aggregate.year(), aggregate.month()),
                        aggregate -> aggregate
                ));

        List<MonthlyQuantityTrendPoint> quantityTrend = new ArrayList<>();
        List<MonthlyFinancialPoint> financialTrend = new ArrayList<>();
        for (int i = 0; i < MONTH_WINDOW; i++) {
            YearMonth month = startMonth.plusMonths(i);
            MonthlyRestockAggregate restock = restockByMonth.get(month);
            MonthlySalesAggregate sales = salesByMonth.get(month);
            long restockQty = restock != null ? restock.totalQuantity() : 0L;
            long salesQty = sales != null ? sales.totalQuantity() : 0L;
            BigDecimal restockSpend = restock != null ? restock.totalAmount() : BigDecimal.ZERO;
            BigDecimal salesRevenue = sales != null ? sales.totalRevenue() : BigDecimal.ZERO;
            quantityTrend.add(new MonthlyQuantityTrendPoint(month.getYear(), month.getMonthValue(), restockQty, salesQty));
            financialTrend.add(new MonthlyFinancialPoint(month.getYear(), month.getMonthValue(), restockSpend, salesRevenue));
        }

        OffsetDateTime exportStart = rangeStart;
        OffsetDateTime exportEnd = rangeEnd;
        List<TopRestockedItem> topRestockedItems = purchaseOrderItemRepository
                .topRestockedBetween(warehouseScope, exportStart, exportEnd)
                .stream()
                .limit(5)
                .map(projection -> new TopRestockedItem(
                        projection.productId(),
                        projection.productName(),
                        projection.productSku(),
                        projection.totalQuantity(),
                        projection.orderCount()
                ))
                .toList();

        Map<Long, ProductRestockAggregate> restockAggregateByProduct = purchaseOrderItemRepository
                .aggregateRestockByProduct(warehouseScope, exportStart, exportEnd)
                .stream()
                .collect(Collectors.toMap(ProductRestockAggregate::productId, aggregate -> aggregate));

        Map<Long, ProductSalesAggregate> salesAggregateByProduct = purchaseRepository
                .aggregateSalesByProduct(warehouseScope, exportStart, exportEnd)
                .stream()
                .collect(Collectors.toMap(ProductSalesAggregate::productId, aggregate -> aggregate));

        Set<Long> productIds = new HashSet<>();
        productIds.addAll(restockAggregateByProduct.keySet());
        productIds.addAll(salesAggregateByProduct.keySet());

        List<RestockDemandPoint> restockDemandComparison = productIds.stream()
                .map(productId -> {
                    ProductRestockAggregate restock = restockAggregateByProduct.get(productId);
                    ProductSalesAggregate sales = salesAggregateByProduct.get(productId);
                    String productName = restock != null ? restock.productName() : sales != null ? sales.productName() : "Unknown";
                    String productSku = restock != null ? restock.productSku() : sales != null ? sales.productSku() : "--";
                    long restockedQty = restock != null ? restock.totalQuantity() : 0L;
                    long soldQty = sales != null ? sales.totalQuantity() : 0L;
                    return new RestockDemandPoint(productId, productName, productSku, restockedQty, soldQty);
                })
                .sorted(Comparator.comparingLong((RestockDemandPoint point) -> point.restockedQuantity() + point.soldQuantity()).reversed())
                .limit(7)
                .toList();

        String scopeLabel = resolveScopeLabel(currentUser, warehouseScope);
        return new AnalyticsDashboardResponse(
                inventoryStatus,
                statusDistribution,
                quantityTrend,
                financialTrend,
                topRestockedItems,
                restockDemandComparison,
                scopeLabel,
                OffsetDateTime.now()
        );
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public ExportPayload exportExcel(SecurityUserDetails currentUser, Long requestedWarehouseId) {
        AnalyticsDashboardResponse dashboard = buildDashboard(currentUser, requestedWarehouseId);
        try (Workbook workbook = new XSSFWorkbook()) {
            writeSummarySheet(workbook, dashboard);
            writeMonthlyQuantitySheet(workbook, dashboard);
            writeMonthlyFinancialSheet(workbook, dashboard);
            writeTopRestockedSheet(workbook, dashboard);
            writeRestockDemandSheet(workbook, dashboard);
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                String filename = buildFilename("xlsx", dashboard.scopeLabel());
                return new ExportPayload(outputStream.toByteArray(), filename);
            }
        } catch (IOException ioException) {
            throw new IllegalStateException("Unable to generate Excel analytics report", ioException);
        }
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public ExportPayload exportPdf(SecurityUserDetails currentUser, Long requestedWarehouseId) {
        AnalyticsDashboardResponse dashboard = buildDashboard(currentUser, requestedWarehouseId);
        try (PDDocument document = new PDDocument(); PdfWriter writer = new PdfWriter(document)) {
            writer.writeLine("SmartShelfX Analytics Dashboard", true, 16f);
            writer.writeLine("Scope: " + dashboard.scopeLabel(), false, 12f);
            writer.writeLine("Generated: " + dashboard.generatedAt(), false, 12f);
            writer.blankLine();

            writer.writeLine("Inventory Status", true, 13f);
            InventoryStatusSummary inventory = dashboard.inventoryStatus();
            writer.writeLine("Total Products: " + inventory.totalProducts(), false, 11f);
            writer.writeLine("Total Units: " + inventory.totalUnits(), false, 11f);
            writer.writeLine("Low Stock Products: " + inventory.lowStockProducts(), false, 11f);
            writer.writeLine("Out of Stock Products: " + inventory.outOfStockProducts(), false, 11f);
            writer.writeLine("Auto-Restock Enabled: " + inventory.autoRestockEnabledProducts(), false, 11f);
            writer.blankLine();

            writer.writeLine("Monthly Quantities (Last " + MONTH_WINDOW + " Months)", true, 13f);
            for (MonthlyQuantityTrendPoint point : dashboard.monthlyQuantityTrend()) {
                writer.writeLine(String.format(Locale.ENGLISH,
                        "%s · Restocked %d · Sold %d",
                        point.label(), point.restockedQuantity(), point.soldQuantity()), false, 11f);
            }
            writer.blankLine();

            writer.writeLine("Monthly Financials", true, 13f);
            for (MonthlyFinancialPoint point : dashboard.monthlyFinancials()) {
                writer.writeLine(String.format(Locale.ENGLISH,
                        "%s · Restock Spend ₹%.2f · Sales Revenue ₹%.2f",
                        point.label(), point.restockSpend(), point.salesRevenue()), false, 11f);
            }
            writer.blankLine();

            writer.writeLine("Top Restocked Items", true, 13f);
            if (dashboard.topRestockedItems().isEmpty()) {
                writer.writeLine("No restock activity in selected window.", false, 11f);
            } else {
                for (TopRestockedItem item : dashboard.topRestockedItems()) {
                    writer.writeLine(String.format(Locale.ENGLISH,
                            "%s (%s) · Qty %d · Orders %d",
                            item.productName(), item.productSku(), item.totalQuantity(), item.orderCount()), false, 11f);
                }
            }
            writer.blankLine();

            writer.writeLine("Restock vs Demand", true, 13f);
            if (dashboard.restockDemandComparison().isEmpty()) {
                writer.writeLine("No comparative data available.", false, 11f);
            } else {
                for (RestockDemandPoint point : dashboard.restockDemandComparison()) {
                    writer.writeLine(String.format(Locale.ENGLISH,
                            "%s (%s) · Restocked %d · Sold %d",
                            point.productName(), point.productSku(), point.restockedQuantity(), point.soldQuantity()), false, 11f);
                }
            }

            writer.close();
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                document.save(outputStream);
                String filename = buildFilename("pdf", dashboard.scopeLabel());
                return new ExportPayload(outputStream.toByteArray(), filename);
            }
        } catch (IOException ioException) {
            throw new IllegalStateException("Unable to generate PDF analytics report", ioException);
        }
    }

    private List<ProductEntity> fetchProductsByScope(Long warehouseScope) {
        if (warehouseScope == null) {
            return productRepository.findAll();
        }
        return productRepository.findAllByWarehouse_Id(warehouseScope);
    }

    private InventoryStatusSummary computeInventoryStatus(List<ProductEntity> products) {
        long totalUnits = products.stream().mapToLong(ProductEntity::getCurrentStock).sum();
        long lowStockProducts = products.stream()
                .filter(product -> product.getCurrentStock() > 0 && product.getCurrentStock() <= product.getReorderLevel())
                .count();
        long outOfStockProducts = products.stream()
                .filter(product -> product.getCurrentStock() == 0)
                .count();
        long autoRestockProducts = products.stream()
                .filter(ProductEntity::isAutoRestockEnabled)
                .count();
        return new InventoryStatusSummary(
                products.size(),
                totalUnits,
                lowStockProducts,
                outOfStockProducts,
                autoRestockProducts
        );
    }

    private List<StatusSlice> computeStatusDistribution(List<ProductEntity> products) {
        long healthyProducts = 0L;
        long healthyUnits = 0L;
        long lowProducts = 0L;
        long lowUnits = 0L;
        long outProducts = 0L;
        for (ProductEntity product : products) {
            if (product.getCurrentStock() == 0) {
                outProducts++;
            } else if (product.getCurrentStock() <= product.getReorderLevel()) {
                lowProducts++;
                lowUnits += product.getCurrentStock();
            } else {
                healthyProducts++;
                healthyUnits += product.getCurrentStock();
            }
        }
        List<StatusSlice> slices = new ArrayList<>();
        slices.add(new StatusSlice("Healthy", healthyProducts, healthyUnits));
        slices.add(new StatusSlice("Low Stock", lowProducts, lowUnits));
        slices.add(new StatusSlice("Out of Stock", outProducts, 0));
        return slices;
    }

    private Long resolveWarehouseScope(SecurityUserDetails currentUser, Long requestedWarehouseId) {
        if ("MANAGER".equalsIgnoreCase(currentUser.role())) {
            Long managerWarehouse = currentUser.warehouseId();
            if (managerWarehouse == null) {
                throw new IllegalArgumentException("Manager is not assigned to a warehouse");
            }
            return managerWarehouse;
        }
        if (requestedWarehouseId == null) {
            return null;
        }
        if (!warehouseRepository.existsById(requestedWarehouseId)) {
            throw new IllegalArgumentException("Warehouse not found");
        }
        return requestedWarehouseId;
    }

    private String resolveScopeLabel(SecurityUserDetails currentUser, Long warehouseScope) {
        if (warehouseScope == null) {
            return "All Warehouses";
        }
        WarehouseEntity warehouse = warehouseRepository.findById(warehouseScope)
                .orElse(null);
        if (warehouse != null) {
            return warehouse.getName() + " (" + warehouse.getLocationCode() + ")";
        }
        if ("MANAGER".equalsIgnoreCase(currentUser.role())) {
            return "Assigned Warehouse";
        }
        return "Warehouse ID " + warehouseScope;
    }

    private String buildFilename(String extension, String scopeLabel) {
        String safeScope = scopeLabel == null ? "all" : scopeLabel
                .toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (safeScope.isBlank()) {
            safeScope = "all";
        }
        YearMonth current = YearMonth.now();
        return String.format(Locale.ENGLISH, "analytics-dashboard-%s-%d-%02d.%s", safeScope, current.getYear(), current.getMonthValue(), extension);
    }

    private void writeSummarySheet(Workbook workbook, AnalyticsDashboardResponse dashboard) {
        Sheet sheet = workbook.createSheet("Summary");
        int rowIndex = 0;
        Row titleRow = sheet.createRow(rowIndex++);
        titleRow.createCell(0, CellType.STRING).setCellValue("Scope");
        titleRow.createCell(1, CellType.STRING).setCellValue(dashboard.scopeLabel());

        InventoryStatusSummary inventory = dashboard.inventoryStatus();
        Map<String, String> metrics = new HashMap<>();
        metrics.put("Total Products", String.valueOf(inventory.totalProducts()));
        metrics.put("Total Units", String.valueOf(inventory.totalUnits()));
        metrics.put("Low Stock Products", String.valueOf(inventory.lowStockProducts()));
        metrics.put("Out of Stock Products", String.valueOf(inventory.outOfStockProducts()));
        metrics.put("Auto-Restock Enabled", String.valueOf(inventory.autoRestockEnabledProducts()));

        for (Map.Entry<String, String> entry : metrics.entrySet()) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0, CellType.STRING).setCellValue(entry.getKey());
            row.createCell(1, CellType.STRING).setCellValue(entry.getValue());
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void writeMonthlyQuantitySheet(Workbook workbook, AnalyticsDashboardResponse dashboard) {
        Sheet sheet = workbook.createSheet("Monthly Quantities");
        Row header = sheet.createRow(0);
        header.createCell(0, CellType.STRING).setCellValue("Month");
        header.createCell(1, CellType.STRING).setCellValue("Restocked Quantity");
        header.createCell(2, CellType.STRING).setCellValue("Sold Quantity");
        int rowIndex = 1;
        for (MonthlyQuantityTrendPoint point : dashboard.monthlyQuantityTrend()) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0, CellType.STRING).setCellValue(point.label());
            row.createCell(1, CellType.NUMERIC).setCellValue(point.restockedQuantity());
            row.createCell(2, CellType.NUMERIC).setCellValue(point.soldQuantity());
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.autoSizeColumn(2);
    }

    private void writeMonthlyFinancialSheet(Workbook workbook, AnalyticsDashboardResponse dashboard) {
        Sheet sheet = workbook.createSheet("Monthly Financials");
        Row header = sheet.createRow(0);
        header.createCell(0, CellType.STRING).setCellValue("Month");
        header.createCell(1, CellType.STRING).setCellValue("Restock Spend (₹)");
        header.createCell(2, CellType.STRING).setCellValue("Sales Revenue (₹)");
        int rowIndex = 1;
        for (MonthlyFinancialPoint point : dashboard.monthlyFinancials()) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0, CellType.STRING).setCellValue(point.label());
            row.createCell(1, CellType.NUMERIC).setCellValue(point.restockSpend().doubleValue());
            row.createCell(2, CellType.NUMERIC).setCellValue(point.salesRevenue().doubleValue());
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.autoSizeColumn(2);
    }

    private void writeTopRestockedSheet(Workbook workbook, AnalyticsDashboardResponse dashboard) {
        Sheet sheet = workbook.createSheet("Top Restocked");
        Row header = sheet.createRow(0);
        header.createCell(0, CellType.STRING).setCellValue("Product");
        header.createCell(1, CellType.STRING).setCellValue("SKU");
        header.createCell(2, CellType.STRING).setCellValue("Quantity");
        header.createCell(3, CellType.STRING).setCellValue("Orders");
        int rowIndex = 1;
        for (TopRestockedItem item : dashboard.topRestockedItems()) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0, CellType.STRING).setCellValue(item.productName());
            row.createCell(1, CellType.STRING).setCellValue(item.productSku());
            row.createCell(2, CellType.NUMERIC).setCellValue(item.totalQuantity());
            row.createCell(3, CellType.NUMERIC).setCellValue(item.orderCount());
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.autoSizeColumn(2);
        sheet.autoSizeColumn(3);
    }

    private void writeRestockDemandSheet(Workbook workbook, AnalyticsDashboardResponse dashboard) {
        Sheet sheet = workbook.createSheet("Restock vs Demand");
        Row header = sheet.createRow(0);
        header.createCell(0, CellType.STRING).setCellValue("Product");
        header.createCell(1, CellType.STRING).setCellValue("SKU");
        header.createCell(2, CellType.STRING).setCellValue("Restocked");
        header.createCell(3, CellType.STRING).setCellValue("Sold");
        int rowIndex = 1;
        for (RestockDemandPoint point : dashboard.restockDemandComparison()) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0, CellType.STRING).setCellValue(point.productName());
            row.createCell(1, CellType.STRING).setCellValue(point.productSku());
            row.createCell(2, CellType.NUMERIC).setCellValue(point.restockedQuantity());
            row.createCell(3, CellType.NUMERIC).setCellValue(point.soldQuantity());
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.autoSizeColumn(2);
        sheet.autoSizeColumn(3);
    }

    private static final class PdfWriter implements AutoCloseable {
        private static final float TOP_MARGIN = 750f;
        private static final float LEFT_MARGIN = 50f;
        private static final float MIN_Y = 80f;
        private static final float LINE_STEP = 18f;

        private final PDDocument document;
        private PDPage page;
        private PDPageContentStream contentStream;
        private float cursorY;

        PdfWriter(PDDocument document) throws IOException {
            this.document = document;
            this.page = new PDPage();
            document.addPage(page);
            this.contentStream = new PDPageContentStream(document, page);
            this.cursorY = TOP_MARGIN;
        }

        void writeLine(String text, boolean bold, float fontSize) throws IOException {
            ensureSpace();
            contentStream.beginText();
            contentStream.setFont(bold ? PDType1Font.HELVETICA_BOLD : PDType1Font.HELVETICA, fontSize);
            contentStream.newLineAtOffset(LEFT_MARGIN, cursorY);
            contentStream.showText(sanitize(text));
            contentStream.endText();
            cursorY -= LINE_STEP;
        }

        void blankLine() throws IOException {
            cursorY -= LINE_STEP;
            ensureSpace();
        }

        private String sanitize(String text) {
            if (text == null || text.isBlank()) {
                return "";
            }
            // Helvetica (WinAnsi) cannot render the rupee symbol, so swap it for an ASCII-friendly token.
            return text.replace("\u20B9", "INR ");
        }

        private void ensureSpace() throws IOException {
            if (cursorY < MIN_Y) {
                contentStream.close();
                page = new PDPage();
                document.addPage(page);
                contentStream = new PDPageContentStream(document, page);
                cursorY = TOP_MARGIN;
            }
        }

        @Override
        public void close() throws IOException {
            contentStream.close();
        }
    }
}
