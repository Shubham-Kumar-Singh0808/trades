package com.pawfectfoods.trades.dto;

public record TradeStatsResponse(
    long totalTrades,
    long airTrades,
    long seaTrades
) {}
