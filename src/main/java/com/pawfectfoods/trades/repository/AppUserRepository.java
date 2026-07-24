package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.RoleName;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);

    Optional<AppUser> findFirstByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findDistinctByRoles_Name(RoleName roleName);

    Page<AppUser> findByEmailNot(String email, Pageable pageable);

    @Query("SELECT u FROM AppUser u WHERE u.email != :email AND NOT EXISTS (SELECT 1 FROM u.roles r WHERE r.name = :excludeRole)")
    Page<AppUser> findByEmailNotAndWithoutRole(@Param("email") String email, @Param("excludeRole") RoleName excludeRole, Pageable pageable);
}
