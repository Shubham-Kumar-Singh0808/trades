package com.pawfectfoods.trades.dto;

public record GstLookupResponse(
        String gstNo,
        String companyName,
        String registeredAddress,
        String gstStatus,
        boolean gstActive
) {
}
