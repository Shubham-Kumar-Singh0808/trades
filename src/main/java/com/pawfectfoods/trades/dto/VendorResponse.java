package com.pawfectfoods.trades.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.pawfectfoods.trades.model.VendorStatus;

public record VendorResponse(
        UUID id,
        String name,
        String companyName,
        String gstNo,
        String registeredAddress,
        String gstStatus,
        Boolean gstActive,
        String officeAddress,
        String mobileNo,
        String email,
        boolean active,
        VendorStatus registrationStatus,
        boolean executiveApproved,
        Instant executiveApprovedAt,
        String executiveApprovedBy,
        String rejectionReason,
        Instant createdAt,
        List<ContactPersonItem> contactPersons
) {
    public record ContactPersonItem(UUID id, String name, String designation, String email, String phone) {
    }
}
