package com.pawfectfoods.trades.config;

import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.model.Trade;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.RoleRepository;
import com.pawfectfoods.trades.repository.TradeRepository;
import java.util.Arrays;
import java.util.HashSet;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final TradeRepository tradeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppBootstrapProperties bootstrapProperties;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        fixTradeModeConstraint();
        initializeRoles();
        initializeAdminUser();
        backfillTradeAutoCloseAt();
    }

    private void fixTradeModeConstraint() {
        try {
            // Drop the old check constraint that only allowed ONLINE/OFFLINE/HYBRID
            jdbcTemplate.execute("ALTER TABLE trade DROP CONSTRAINT IF EXISTS trade_mode_check");
            log.info("Dropped legacy trade_mode_check constraint (if it existed)");
        } catch (Exception e) {
            log.warn("Could not drop trade_mode_check constraint: {}", e.getMessage());
        }
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

    private void backfillTradeAutoCloseAt() {
        List<Trade> tradesNeedingAutoClose = tradeRepository.findAll().stream()
                .filter(trade -> trade.getAutoCloseAt() == null)
                .toList();

        if (tradesNeedingAutoClose.isEmpty()) {
            return;
        }

        ZoneId zoneId = ZoneId.of("Asia/Kolkata");
        for (Trade trade : tradesNeedingAutoClose) {
            Instant createdAt = trade.getCreatedAt();
            ZonedDateTime createdDateTime = createdAt.atZone(zoneId);
            ZonedDateTime nextDayClose = createdDateTime.toLocalDate()
                    .plusDays(1)
                    .atTime(LocalTime.of(10, 0))
                    .atZone(zoneId);
            if (!nextDayClose.isAfter(createdDateTime)) {
                nextDayClose = nextDayClose.plusDays(1);
            }
            trade.setAutoCloseAt(nextDayClose.toInstant());
        }

        tradeRepository.saveAll(tradesNeedingAutoClose);
        log.info("Backfilled autoCloseAt for {} existing trade(s)", tradesNeedingAutoClose.size());
    }
}
