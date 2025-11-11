package com.smartshelfx.inventoryservice.purchase;

import java.math.BigDecimal;
import java.util.List;

public record UserPurchaseHistoryResponse(
        List<UserPurchaseItemResponse> purchases,
        BigDecimal totalSpend
) {}
