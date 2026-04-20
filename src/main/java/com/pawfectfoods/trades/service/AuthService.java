package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.AuthResponse;
import com.pawfectfoods.trades.dto.ContactPersonRequest;
import com.pawfectfoods.trades.dto.ForgotPasswordRequest;
import com.pawfectfoods.trades.dto.GstLookupResponse;
import com.pawfectfoods.trades.dto.LoginRequest;
import com.pawfectfoods.trades.dto.MessageResponse;
import com.pawfectfoods.trades.dto.RegisterRequest;
import com.pawfectfoods.trades.dto.ResetPasswordRequest;
import com.pawfectfoods.trades.dto.SetPasswordRequest;
import com.pawfectfoods.trades.dto.SessionResponse;
import com.pawfectfoods.trades.dto.UpdateProfileRequest;
import com.pawfectfoods.trades.dto.VendorRegistrationRequest;
import com.pawfectfoods.trades.model.AccountTokenPurpose;
import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.EmailVerificationToken;
import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.model.VendorContactPerson;
import com.pawfectfoods.trades.model.VendorStatus;
import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.EmailVerificationTokenRepository;
import com.pawfectfoods.trades.repository.RoleRepository;
import com.pawfectfoods.trades.repository.VendorRepository;
import com.pawfectfoods.trades.security.JwtUtil;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final RoleRepository roleRepository;
    private final VendorRepository vendorRepository;
    private final GstLookupService gstLookupService;

    @Transactional(readOnly = true)
    public GstLookupResponse gstLookup(String gstNo) {
        return gstLookupService.lookup(gstNo);
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (appUserRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        Role vendorRole = roleRepository.findByName(RoleName.VENDOR)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Default role VENDOR is not initialized"));

        AppUser user = AppUser.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .emailVerified(false)
            .roles(Set.of(vendorRole))
                .build();

        AppUser savedUser = appUserRepository.save(user);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(savedUser)
                .expiresAt(Instant.now().plusSeconds(24 * 60 * 60))
                .used(false)
            .purpose(AccountTokenPurpose.EMAIL_VERIFICATION)
                .build();

        tokenRepository.save(token);
        emailService.sendVerificationEmail(savedUser.getEmail(), token.getToken());

        return new MessageResponse("Registration successful. Check your email to verify your account.");
    }

        @Transactional
        public MessageResponse registerVendor(VendorRegistrationRequest request) {
        if (vendorRepository.existsByEmail(request.email()) || appUserRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor with this email already exists");
        }

        if (vendorRepository.existsByGstNo(request.gstNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor with this GST number already exists");
        }

        GstLookupResponse gstDetails = gstLookupService.lookup(request.gstNo());

        Vendor vendor = Vendor.builder()
            .name(request.name())
            .companyName(gstDetails.companyName())
            .gstNo(gstDetails.gstNo())
            .registeredAddress(gstDetails.registeredAddress())
            .gstStatus(gstDetails.gstStatus())
            .gstActive(gstDetails.gstActive())
            .officeAddress(request.officeAddress())
            .mobileNo(request.contactPersons().get(0).phone())
            .email(request.email())
            .active(false)
            .registrationStatus(VendorStatus.PENDING_APPROVAL)
            .pendingPasswordHash(passwordEncoder.encode(request.password()))
            .createdAt(Instant.now())
            .build();

        for (ContactPersonRequest contact : request.contactPersons()) {
            vendor.getContactPersons().add(VendorContactPerson.builder()
                    .vendor(vendor)
                    .name(contact.name())
                    .designation(contact.designation())
                    .email(contact.email())
                    .phone(contact.phone())
                    .build());
        }

        vendorRepository.save(vendor);
        emailService.sendVendorRegistrationPendingEmail(request.email(), request.name());
        return new MessageResponse("Vendor registration submitted successfully. Your request is pending admin approval.");
        }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmail(request.email()).orElse(null);
        EmailVerificationToken pendingAdminSetupToken = findPendingAdminSetupToken(user);

        if (user != null && !user.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to login. Please contact the admin.");
        }

        if (user != null && !user.isEmailVerified() && pendingAdminSetupToken == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email is not verified");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (user == null) {
            user = appUserRepository.findByEmail(request.email())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        }

        pendingAdminSetupToken = findPendingAdminSetupToken(user);
        if (pendingAdminSetupToken != null) {
            return new AuthResponse(
                    null,
                    "SETUP",
                    pendingAdminSetupToken.getExpiresAt(),
                    true,
                    pendingAdminSetupToken.getToken());
        }

        Instant expiresAt = Instant.now().plusMillis(jwtUtil.getExpirationMs());
        String jwt = jwtUtil.generateToken(
                user.getEmail(),
            user.getRoles().stream().map(role -> "ROLE_" + role.getName().name()).toList());

        return new AuthResponse(jwt, "Bearer", expiresAt, false, null);
    }

    private EmailVerificationToken findPendingAdminSetupToken(AppUser user) {
        if (user == null) {
            return null;
        }

        EmailVerificationToken token = tokenRepository
                .findFirstByUserAndPurposeAndUsedFalseOrderByExpiresAtDesc(user, AccountTokenPurpose.ADMIN_USER_SETUP)
                .orElse(null);

        if (token == null) {
            return null;
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Temporary password expired. Please contact admin for new credentials.");
        }

        return token;
    }

    @Transactional
    public MessageResponse verifyEmail(String tokenValue) {
        EmailVerificationToken token = tokenRepository.findByTokenAndUsedFalseAndPurpose(
                tokenValue, AccountTokenPurpose.EMAIL_VERIFICATION)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification token has expired");
        }

        AppUser user = token.getUser();
        user.setEmailVerified(true);
        user.setEnabled(true);
        token.setUsed(true);

        vendorRepository.findByEmail(user.getEmail()).ifPresent(vendor -> {
            vendor.setActive(true);
            vendorRepository.save(vendor);
        });

        appUserRepository.save(user);
        tokenRepository.save(token);

        return new MessageResponse("Email verified successfully. You can now log in.");
    }

    @Transactional
    public MessageResponse setupVendorPassword(SetPasswordRequest request) {
        EmailVerificationToken token = tokenRepository.findByTokenAndUsedFalse(request.token())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password setup token"));

        if (token.getPurpose() != AccountTokenPurpose.VENDOR_PASSWORD_SETUP
                && token.getPurpose() != AccountTokenPurpose.ADMIN_USER_SETUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password setup token");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password setup token has expired");
        }

        AppUser user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEmailVerified(true);
        user.setEnabled(true);
        token.setUsed(true);

        vendorRepository.findByEmail(user.getEmail()).ifPresent(vendor -> {
            vendor.setActive(true);
            vendorRepository.save(vendor);
        });

        appUserRepository.save(user);
        tokenRepository.save(token);
        return new MessageResponse("Account setup successful. You can now log in.");
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        AppUser user = appUserRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No user found with this id please register yourself"));

        EmailVerificationToken token = EmailVerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusSeconds(30 * 60))
                .used(false)
                .purpose(AccountTokenPurpose.PASSWORD_RESET)
                .build();
        tokenRepository.save(token);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token.getToken());
        return new MessageResponse("Password reset link sent to your email");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        EmailVerificationToken token = tokenRepository.findByTokenAndUsedFalseAndPurpose(
                        request.token(), AccountTokenPurpose.PASSWORD_RESET)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset token"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has expired");
        }

        AppUser user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        token.setUsed(true);
        appUserRepository.save(user);
        tokenRepository.save(token);
        return new MessageResponse("Password reset successful. You can now login.");
    }

    @Transactional
    public SessionResponse updateCurrentProfile(UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        AppUser user = appUserRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.VENDOR)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Vendor profile changes require approval. Please use vendor profile change request.");
        }

        user.setName(request.name());
        user.setMobileNo(request.mobileNo());
        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.VENDOR)) {
            user.setCompanyName(request.companyName());
            vendorRepository.findByEmail(user.getEmail()).ifPresent(vendor -> {
                vendor.setName(request.name());
                vendor.setMobileNo(request.mobileNo());
                vendor.setCompanyName(request.companyName());
                vendorRepository.save(vendor);
            });
        }
        AppUser updated = appUserRepository.save(user);
        return new SessionResponse(
                updated.getEmail(),
                updated.getName(),
                updated.getMobileNo(),
                updated.getCompanyName(),
                updated.getRoles().stream().map(r -> r.getName().name()).collect(java.util.stream.Collectors.toSet()));
    }

    @Transactional(readOnly = true)
    public SessionResponse getCurrentSession() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        AppUser user = appUserRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new SessionResponse(
                user.getEmail(),
            user.getName(),
            user.getMobileNo(),
            user.getCompanyName(),
                user.getRoles().stream().map(r -> r.getName().name()).collect(java.util.stream.Collectors.toSet()));
    }
}
