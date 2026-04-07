package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
