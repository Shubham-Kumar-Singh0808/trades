package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.TradeMode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TradeResponse(
        UUID id,
        String tradeId,
        TradeMode mode,
        String description,
        String jobSheetPdfPath,
        String trackingListPdfPath,
        boolean biddingOpen,
        int currentRound,
        boolean tradeClosed,
        BigDecimal finalL1Rate,
        Instant createdAt,
        String createdBy
) {
}
