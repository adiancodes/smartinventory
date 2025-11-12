package com.smartshelfx.inventoryservice.analytics;

import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public AnalyticsDashboardResponse dashboard(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                                @RequestParam(value = "warehouseId", required = false) Long warehouseId) {
        return analyticsService.buildDashboard(currentUser, warehouseId);
    }

    @GetMapping(value = "/export/excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> exportExcel(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                               @RequestParam(value = "warehouseId", required = false) Long warehouseId) {
        ExportPayload payload = analyticsService.exportExcel(currentUser, warehouseId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.filename() + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(payload.content());
    }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> exportPdf(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                            @RequestParam(value = "warehouseId", required = false) Long warehouseId) {
        ExportPayload payload = analyticsService.exportPdf(currentUser, warehouseId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.filename() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(payload.content());
    }
}
