package com.smartshelfx.inventoryservice.restock;

import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/restock/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<PurchaseOrderResponse> listPurchaseOrders(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                                          @RequestParam(name = "warehouseId", required = false) Long warehouseId) {
        return purchaseOrderService.list(currentUser, Optional.ofNullable(warehouseId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public PurchaseOrderResponse createPurchaseOrder(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                                     @Valid @RequestBody PurchaseOrderRequest request) {
        return purchaseOrderService.create(currentUser, request);
    }
}
