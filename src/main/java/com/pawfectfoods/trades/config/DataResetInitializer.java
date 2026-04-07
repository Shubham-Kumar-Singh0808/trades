package com.pawfectfoods.trades.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataResetInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.bootstrap.reset-data:false}")
    private boolean resetData;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!resetData) {
            return;
        }

        jdbcTemplate.execute(
            "TRUNCATE TABLE audit_logs, email_verification_token, sub_vendor, trade, user_roles, vendor, app_user, roles CASCADE");
        log.warn("Bootstrap reset enabled: all existing data truncated from core tables.");
    }
}
