package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.SubVendor;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubVendorRepository extends JpaRepository<SubVendor, UUID> {
    long countByVendorId(UUID vendorId);
}
