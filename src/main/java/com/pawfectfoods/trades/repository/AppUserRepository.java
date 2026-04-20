package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.RoleName;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);

    Optional<AppUser> findFirstByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findDistinctByRoles_Name(RoleName roleName);
}
