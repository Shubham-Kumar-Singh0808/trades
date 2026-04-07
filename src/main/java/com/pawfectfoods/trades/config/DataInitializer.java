package com.pawfectfoods.trades.config;

import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.RoleRepository;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppBootstrapProperties bootstrapProperties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initializeRoles();
        initializeAdminUser();
    }

    private void initializeRoles() {
        Arrays.stream(RoleName.values()).forEach(roleName -> {
            roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
        });
        log.info("Roles initialized: {}", Arrays.toString(RoleName.values()));
    }

    private void initializeAdminUser() {
        String adminEmail = bootstrapProperties.getEmail();
        String adminPassword = bootstrapProperties.getPassword();

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                existingUser -> {
                    ensureAdminRole(existingUser);
                    log.info("Admin user already exists: {}", adminEmail);
                },
                () -> {
                    Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                            .orElseThrow(() -> new IllegalStateException("ADMIN role is not initialized"));

                    AppUser admin = AppUser.builder()
                            .email(adminEmail)
                            .password(passwordEncoder.encode(adminPassword))
                            .enabled(true)
                            .emailVerified(true)
                            .roles(new HashSet<>(Set.of(adminRole)))
                            .build();

                    userRepository.save(admin);
                    log.info("Default admin user created: {}", adminEmail);
                });
    }

    private void ensureAdminRole(AppUser user) {
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role is not initialized"));

        if (user.getRoles().stream().noneMatch(r -> r.getName() == RoleName.ADMIN)) {
            user.getRoles().add(adminRole);
            userRepository.save(user);
            log.info("ADMIN role assigned to existing user: {}", user.getEmail());
        }
    }
}
