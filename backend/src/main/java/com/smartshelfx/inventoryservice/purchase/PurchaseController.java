package com.smartshelfx.inventoryservice.purchase;

import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public PurchaseResponse createPurchase(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                           @Valid @RequestBody PurchaseRequest request) {
        return purchaseService.purchaseProduct(request, currentUser);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public UserPurchaseHistoryResponse userPurchases(@AuthenticationPrincipal SecurityUserDetails currentUser) {
        return purchaseService.historyForUser(currentUser);
    }

    @GetMapping("/summary/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public SalesSummaryResponse adminSummary() {
        return purchaseService.adminSummary();
    }

    @GetMapping("/summary/admin/by-warehouse")
    @PreAuthorize("hasRole('ADMIN')")
    public List<WarehouseSalesResponse> adminSummaryByWarehouse() {
        return purchaseService.adminSummaryByWarehouse();
    }

    @GetMapping("/summary/admin/by-warehouse/{warehouseId}/products")
    @PreAuthorize("hasRole('ADMIN')")
    public List<WarehouseProductSalesResponse> adminProductSalesByWarehouse(@PathVariable Long warehouseId) {
        return purchaseService.adminProductSalesByWarehouse(warehouseId);
    }

    @GetMapping("/summary/manager")
    @PreAuthorize("hasRole('MANAGER')")
    public SalesSummaryResponse managerSummary(@AuthenticationPrincipal SecurityUserDetails currentUser) {
        return purchaseService.managerSummary(currentUser);
    }
}
