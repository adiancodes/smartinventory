package com.smartshelfx.inventoryservice.product;

import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','USER')")
    public List<ProductResponse> listProducts(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                              @RequestParam(name = "warehouseId", required = false) Long warehouseId,
                                              @RequestParam(name = "category", required = false) String category,
                                              @RequestParam(name = "vendor", required = false) String vendor,
                                              @RequestParam(name = "stockStatus", required = false) StockStatus stockStatus) {
        return productService.list(currentUser,
        Optional.ofNullable(warehouseId),
        Optional.ofNullable(category).filter(StringUtils::hasText),
        Optional.ofNullable(vendor).filter(StringUtils::hasText),
        Optional.ofNullable(stockStatus));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ProductResponse createProduct(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                         @Valid @RequestBody ProductRequest request) {
        return productService.create(request, currentUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ProductResponse updateProduct(@PathVariable Long id,
                                         @AuthenticationPrincipal SecurityUserDetails currentUser,
                                         @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request, currentUser);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public void deleteProduct(@PathVariable Long id,
                              @AuthenticationPrincipal SecurityUserDetails currentUser) {
        productService.delete(id, currentUser);
    }
}
