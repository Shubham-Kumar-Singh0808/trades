package com.pawfectfoods.trades.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record VendorProfileChangeSubmitRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(max = 500) String officeAddress,
        @Valid @Size(min = 3, max = 3) List<@Valid ContactPersonRequest> contactPersons
) {
}
