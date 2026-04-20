package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.EmailVerificationToken;
import com.pawfectfoods.trades.model.AccountTokenPurpose;
import com.pawfectfoods.trades.model.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
    Optional<EmailVerificationToken> findByTokenAndUsedFalse(String token);

    Optional<EmailVerificationToken> findByTokenAndUsedFalseAndPurpose(String token, AccountTokenPurpose purpose);

    Optional<EmailVerificationToken> findFirstByUserAndPurposeAndUsedFalseOrderByExpiresAtDesc(
            AppUser user,
            AccountTokenPurpose purpose);

    void deleteByUser(AppUser user);
}
