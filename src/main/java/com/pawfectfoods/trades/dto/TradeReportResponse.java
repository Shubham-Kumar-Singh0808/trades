package com.pawfectfoods.trades.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TradeReportResponse(
    UUID id,
    String tradeId,
    String mode,
    Instant createdAt,
    Instant closedAt,
    String status,
    String description,
    BigDecimal finalL1Rate,
    String winnerVendorName,
    String winnerCompanyName,
    BigDecimal totalAmount,
    String weight
) {}
