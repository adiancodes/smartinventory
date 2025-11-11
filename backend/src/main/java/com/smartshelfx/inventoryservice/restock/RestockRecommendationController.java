package com.smartshelfx.inventoryservice.restock;

import com.smartshelfx.inventoryservice.product.StockStatus;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Optional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/restock")
public class RestockRecommendationController {

    private final RestockRecommendationService recommendationService;

        public RestockRecommendationController(RestockRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/suggestions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<RestockRecommendationResponse> getRecommendations(
            @AuthenticationPrincipal SecurityUserDetails currentUser,
            @RequestParam(name = "warehouseId", required = false) @Min(1) Long warehouseId,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "autoOnly", required = false) Boolean autoOnly,
            @RequestParam(name = "stockStatus", required = false) StockStatus stockStatus
    ) {
        Optional<String> normalizedCategory = Optional.ofNullable(category)
                .filter(StringUtils::hasText)
                .map(String::trim);

        return recommendationService.recommend(
                currentUser,
                Optional.ofNullable(warehouseId),
                normalizedCategory,
                Optional.ofNullable(autoOnly),
                Optional.ofNullable(stockStatus)
        );
    }
}
