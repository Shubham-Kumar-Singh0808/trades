package com.pawfectfoods.trades.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record TradeBidEntryResponse(
        int roundNumber,
        String vendorName,
        String companyName,
        BigDecimal bidAmount,
        Instant submittedAt
) {
}
