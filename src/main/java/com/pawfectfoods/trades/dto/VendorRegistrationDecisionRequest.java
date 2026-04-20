package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.Size;

public record VendorRegistrationDecisionRequest(
        @Size(max = 300) String reason
) {
}
