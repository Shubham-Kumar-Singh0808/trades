package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.Vendor;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, UUID> {
    boolean existsByEmail(String email);

    List<Vendor> findByActiveTrue();

    List<Vendor> findByIdIn(List<UUID> ids);

    Optional<Vendor> findByEmail(String email);
}
