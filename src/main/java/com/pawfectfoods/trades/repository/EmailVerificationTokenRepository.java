package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.EmailVerificationToken;
import com.pawfectfoods.trades.model.AccountTokenPurpose;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
    Optional<EmailVerificationToken> findByTokenAndUsedFalse(String token);

    Optional<EmailVerificationToken> findByTokenAndUsedFalseAndPurpose(String token, AccountTokenPurpose purpose);
}
