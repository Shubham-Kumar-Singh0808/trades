package com.pawfectfoods.trades.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubVendorRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 20) String contactNo
) {
}
