package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.TradeMode;
import java.time.Instant;
import java.util.UUID;

public record TradeResponse(
        UUID id,
        String tradeId,
        TradeMode mode,
        String description,
        String pdfPath,
        Instant createdAt,
        String createdBy
) {
}
