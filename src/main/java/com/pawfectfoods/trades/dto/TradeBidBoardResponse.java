package com.pawfectfoods.trades.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TradeBidBoardResponse(
        UUID tradeId,
        boolean biddingOpen,
        int currentRound,
        BigDecimal finalL1Rate,
        BigDecimal myCurrentBid,
        List<TradeBidRankResponse> leaderboard,
        List<TradeBidEntryResponse> bidEntries
) {
}
