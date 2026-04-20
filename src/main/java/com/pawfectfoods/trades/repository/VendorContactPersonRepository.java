package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.VendorContactPerson;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorContactPersonRepository extends JpaRepository<VendorContactPerson, UUID> {
    List<VendorContactPerson> findByVendorIdOrderByNameAsc(UUID vendorId);

    void deleteByVendorId(UUID vendorId);
}
