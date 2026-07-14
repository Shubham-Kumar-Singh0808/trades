package com.pawfectfoods.trades.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TradeBidRankResponse(
        String rank,
        UUID bidId,
        BigDecimal bidAmount,
        String vendorName,
        String companyName,
        BigDecimal ihcInr,
        BigDecimal thcInr,
        BigDecimal cfsInr,
        String otherChargesComments,
        BigDecimal totalInr
) {
}
