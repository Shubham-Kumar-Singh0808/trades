package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.CreateUserRequest;
import com.pawfectfoods.trades.dto.UpdateUserRequest;
import com.pawfectfoods.trades.dto.UserResponse;
import com.pawfectfoods.trades.model.AccountTokenPurpose;
import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.EmailVerificationToken;
import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.EmailVerificationTokenRepository;
import com.pawfectfoods.trades.repository.RoleRepository;
import com.pawfectfoods.trades.repository.VendorRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationTokenRepository tokenRepository;
    private final VendorRepository vendorRepository;
    private final EmailService emailService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (appUserRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        validateRoleDetails(request.role(), request.companyName());

        Set<Role> roles = resolveRoles(Set.of(request.role()));

        String tempPassword = generateTempPassword();

        AppUser user = AppUser.builder()
                .email(request.email())
                .name(request.name())
                .mobileNo(request.mobileNo())
                .companyName(request.companyName())
            .password(passwordEncoder.encode(tempPassword))
                .enabled(request.enabled())
                .emailVerified(false)
                .roles(roles)
                .build();

        AppUser saved = appUserRepository.save(user);
        syncVendorForUser(saved, request.role(), request.name(), request.mobileNo(), request.companyName());
        sendSetupInvite(saved, request.role(), request.name(), tempPassword);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        AppUser user = findUserById(userId);
        String oldEmail = user.getEmail();
        validateRoleDetails(request.role(), request.companyName());

        if (!user.getEmail().equalsIgnoreCase(request.email()) && appUserRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        user.setEmail(request.email());
        user.setName(request.name());
        user.setMobileNo(request.mobileNo());
        user.setCompanyName(request.companyName());
        user.setEnabled(request.enabled());
        user.setRoles(resolveRoles(Set.of(request.role())));

        AppUser updated = appUserRepository.save(user);
        if (!oldEmail.equalsIgnoreCase(updated.getEmail())) {
            vendorRepository.findByEmail(oldEmail).ifPresent(vendorRepository::delete);
        }
        syncVendorForUser(updated, request.role(), request.name(), request.mobileNo(), request.companyName());
        return toResponse(updated);
    }

    @Transactional
    public UserResponse assignRoles(UUID userId, Set<RoleName> roles) {
        AppUser user = findUserById(userId);
        user.setRoles(resolveRoles(roles));
        RoleName primaryRole = roles.stream().findFirst().orElse(RoleName.VENDOR);
        syncVendorForUser(user, primaryRole, user.getName(), user.getMobileNo(), user.getCompanyName());
        return toResponse(appUserRepository.save(user));
    }

    @Transactional
    public UserResponse setEnabled(UUID userId, boolean enabled) {
        AppUser user = findUserById(userId);
        user.setEnabled(enabled);
        AppUser updated = appUserRepository.save(user);
        if (updated.getRoles().stream().anyMatch(r -> r.getName() == RoleName.VENDOR)) {
            vendorRepository.findByEmail(updated.getEmail()).ifPresent(vendor -> {
                vendor.setActive(updated.isEnabled() && updated.isEmailVerified());
                vendorRepository.save(vendor);
            });
        }
        return toResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return appUserRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        AppUser user = findUserById(userId);
        // Delete associated email verification tokens
        tokenRepository.deleteByUser(user);
        // Delete associated vendor if exists
        vendorRepository.findByEmail(user.getEmail()).ifPresent(vendorRepository::delete);
        // Delete the user
        appUserRepository.delete(user);
    }

    private AppUser findUserById(UUID userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserResponse toResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getMobileNo(),
                user.getCompanyName(),
                user.isEnabled(),
                user.isEmailVerified(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
    }

    private void validateRoleDetails(RoleName roleName, String companyName) {
        if (roleName == RoleName.VENDOR && (companyName == null || companyName.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required for vendor role");
        }
    }

    private void syncVendorForUser(AppUser user, RoleName roleName, String name, String mobileNo, String companyName) {
        if (roleName == RoleName.VENDOR) {
            Vendor vendor = vendorRepository.findByEmail(user.getEmail()).orElseGet(Vendor::new);
            vendor.setEmail(user.getEmail());
            vendor.setName(name);
            vendor.setMobileNo(mobileNo);
            vendor.setCompanyName(companyName);
            if (vendor.getCreatedAt() == null) {
                vendor.setCreatedAt(Instant.now());
            }
            vendor.setActive(user.isEnabled() && user.isEmailVerified());
            vendorRepository.save(vendor);
        } else {
            vendorRepository.findByEmail(user.getEmail()).ifPresent(vendorRepository::delete);
        }
    }

    private void sendSetupInvite(AppUser user, RoleName roleName, String name, String tempPassword) {
        EmailVerificationToken setupToken = EmailVerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusSeconds(2 * 60 * 60))
                .used(false)
                .purpose(AccountTokenPurpose.ADMIN_USER_SETUP)
                .build();
        tokenRepository.save(setupToken);

        emailService.sendTemporaryCredentialsEmail(user.getEmail(), name, roleName.name(), tempPassword, setupToken.getExpiresAt());
    }

    private String generateTempPassword() {
        int length = 10;
        StringBuilder value = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = RANDOM.nextInt(TEMP_PASSWORD_CHARS.length());
            value.append(TEMP_PASSWORD_CHARS.charAt(index));
        }
        return value.toString();
    }

    private Set<Role> resolveRoles(Set<RoleName> roleNames) {
        return roleNames.stream()
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Role not found: " + roleName)))
                .collect(Collectors.toSet());
    }
}
