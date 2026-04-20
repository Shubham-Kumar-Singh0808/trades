package com.pawfectfoods.trades.dto;

import java.math.BigDecimal;

public record TradeBidRankResponse(
        String rank,
        BigDecimal bidAmount,
        String vendorName,
        String companyName
) {
}
