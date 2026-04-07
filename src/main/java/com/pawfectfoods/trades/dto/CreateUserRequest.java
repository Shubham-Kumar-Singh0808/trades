package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @Email @NotBlank String email,
        @NotBlank String name,
        @NotBlank String mobileNo,
        String companyName,
        @NotNull RoleName role,
        boolean enabled
) {
}
