package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.model.VendorStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, UUID> {
    boolean existsByEmail(String email);

    boolean existsByGstNo(String gstNo);

    boolean existsByEmailAndIdNot(String email, UUID id);

    List<Vendor> findByActiveTrue();

    List<Vendor> findByIdIn(List<UUID> ids);

    Optional<Vendor> findByEmail(String email);

    Page<Vendor> findByRegistrationStatus(VendorStatus status, Pageable pageable);

    Page<Vendor> findByRegistrationStatusAndExecutiveApprovedFalseOrRegistrationStatusAndExecutiveApprovedIsNull(
            VendorStatus statusForFalse,
            VendorStatus statusForNull,
            Pageable pageable);

    Page<Vendor> findByRegistrationStatusIn(List<VendorStatus> statuses, Pageable pageable);
}
