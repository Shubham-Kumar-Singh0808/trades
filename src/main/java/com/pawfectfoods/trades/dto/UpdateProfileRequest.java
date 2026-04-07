package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String name,
        @NotBlank String mobileNo,
        String companyName
) {
}
