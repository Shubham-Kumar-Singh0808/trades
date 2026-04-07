package com.pawfectfoods.trades.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VendorResponse(
        UUID id,
        String name,
        String companyName,
        String mobileNo,
        String email,
        boolean active,
        Instant createdAt,
        List<SubVendorItem> subVendors
) {
    public record SubVendorItem(UUID id, String name, String companyName, String contactNo) {
    }
}
