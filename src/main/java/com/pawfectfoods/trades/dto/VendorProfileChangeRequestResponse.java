package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.ApprovalStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VendorProfileChangeRequestResponse(
        UUID id,
        UUID vendorId,
        String currentName,
        String currentEmail,
        String currentOfficeAddress,
        String requestedName,
        String requestedEmail,
        String requestedOfficeAddress,
        List<ContactPersonRequest> requestedContactPersons,
        ApprovalStatus status,
        Instant requestedAt,
        String requestedBy,
        String reviewedBy,
        Instant reviewedAt,
        String reviewRemarks
) {
}
