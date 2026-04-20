package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BidSubmitRequest(
        @NotNull @DecimalMin(value = "0.0001") BigDecimal bidAmount
) {
}
