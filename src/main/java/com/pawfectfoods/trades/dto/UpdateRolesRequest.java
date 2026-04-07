package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.RoleName;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record UpdateRolesRequest(@NotEmpty Set<RoleName> roles) {
}
