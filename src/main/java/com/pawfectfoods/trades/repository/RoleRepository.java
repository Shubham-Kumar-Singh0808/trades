package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(RoleName name);
}
