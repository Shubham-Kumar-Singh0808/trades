package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.RoleName;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        String mobileNo,
        String companyName,
        boolean enabled,
        boolean emailVerified,
        Set<RoleName> roles
) {
}
