package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record FinalizeTradeRequest(
        @NotNull UUID winnerBidId
) {
}
