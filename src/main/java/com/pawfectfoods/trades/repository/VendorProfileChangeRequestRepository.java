package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.ApprovalStatus;
import com.pawfectfoods.trades.model.VendorProfileChangeRequest;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorProfileChangeRequestRepository extends JpaRepository<VendorProfileChangeRequest, UUID> {
    Optional<VendorProfileChangeRequest> findFirstByVendorIdAndStatusOrderByRequestedAtDesc(UUID vendorId, ApprovalStatus status);

    Page<VendorProfileChangeRequest> findByStatus(ApprovalStatus status, Pageable pageable);
}
