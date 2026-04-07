package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VendorRegistrationRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 20) String mobileNo,
        @Email @NotBlank @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password
) {
}