package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactPersonRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String designation,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(max = 20) String phone
) {
}
