package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.CreateVendorRequest;
import com.pawfectfoods.trades.dto.SubVendorRequest;
import com.pawfectfoods.trades.dto.VendorResponse;
import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import com.pawfectfoods.trades.model.AccountTokenPurpose;
import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.EmailVerificationToken;
import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.model.SubVendor;
import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.EmailVerificationTokenRepository;
import com.pawfectfoods.trades.repository.RoleRepository;
import com.pawfectfoods.trades.repository.SubVendorRepository;
import com.pawfectfoods.trades.repository.VendorRepository;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VendorService {

    private static final int MAX_SUBVENDORS = 3;

    private final VendorRepository vendorRepository;
    private final SubVendorRepository subVendorRepository;
    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public VendorResponse createVendor(CreateVendorRequest request) {
        if (vendorRepository.existsByEmail(request.email())) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.VENDOR_ALREADY_EXISTS,
                    "Vendor with this email already exists");
        }

        Vendor vendor = Vendor.builder()
                .name(request.name())
                .companyName(request.companyName())
                .mobileNo(request.mobileNo())
                .email(request.email())
            .active(false)
                .createdAt(Instant.now())
                .build();

        Vendor savedVendor = vendorRepository.save(vendor);

        Role vendorRole = roleRepository.findByName(RoleName.VENDOR)
            .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR,
                "Default role VENDOR is not initialized"));

        if (appUserRepository.existsByEmail(savedVendor.getEmail())) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                "User with this vendor email already exists");
        }

        AppUser appUser = AppUser.builder()
            .email(savedVendor.getEmail())
            .name(savedVendor.getName())
            .mobileNo(savedVendor.getMobileNo())
            .companyName(savedVendor.getCompanyName())
            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
            .enabled(false)
            .emailVerified(false)
            .roles(Set.of(vendorRole))
            .build();
        AppUser savedUser = appUserRepository.save(appUser);

        EmailVerificationToken setupToken = EmailVerificationToken.builder()
            .token(UUID.randomUUID().toString())
            .user(savedUser)
            .expiresAt(Instant.now().plusSeconds(48 * 60 * 60))
            .used(false)
            .purpose(AccountTokenPurpose.VENDOR_PASSWORD_SETUP)
            .build();
        tokenRepository.save(setupToken);
        emailService.sendVendorPasswordSetupEmail(savedVendor.getEmail(), savedVendor.getName(), setupToken.getToken());

        return toResponse(savedVendor);
    }

    @Transactional
    public VendorResponse updateVendor(UUID vendorId, CreateVendorRequest request) {
        Vendor vendor = findVendor(vendorId);
        String oldEmail = vendor.getEmail();

        if (!vendor.getEmail().equalsIgnoreCase(request.email()) && vendorRepository.existsByEmail(request.email())) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.VENDOR_ALREADY_EXISTS,
                    "Vendor with this email already exists");
        }

        vendor.setName(request.name());
        vendor.setCompanyName(request.companyName());
        vendor.setMobileNo(request.mobileNo());
        vendor.setEmail(request.email());

        appUserRepository.findByEmail(oldEmail).ifPresent(user -> {
            user.setEmail(request.email());
            user.setName(request.name());
            user.setMobileNo(request.mobileNo());
            user.setCompanyName(request.companyName());
            appUserRepository.save(user);
        });

        return toResponse(vendorRepository.save(vendor));
    }

    @Transactional(readOnly = true)
    public VendorResponse getVendorById(UUID vendorId) {
        return toResponse(findVendor(vendorId));
    }

    @Transactional(readOnly = true)
    public Page<VendorResponse> getAllVendors(Pageable pageable) {
        return vendorRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public VendorResponse addSubVendor(UUID vendorId, SubVendorRequest request) {
        Vendor vendor = findVendor(vendorId);
        long existingCount = subVendorRepository.countByVendorId(vendorId);
        if (existingCount >= MAX_SUBVENDORS) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.SUBVENDOR_LIMIT_EXCEEDED,
                    "A vendor can have at most 3 sub-vendors");
        }

        SubVendor subVendor = SubVendor.builder()
                .name(request.name())
                .companyName(request.companyName())
                .contactNo(request.contactNo())
                .vendor(vendor)
                .build();

        subVendorRepository.save(subVendor);
        return toResponse(vendorRepository.findById(vendorId).orElse(vendor));
    }

    @Transactional
    public void deleteVendor(UUID vendorId) {
        Vendor vendor = findVendor(vendorId);
        vendorRepository.delete(vendor);
    }

    @Transactional
    public VendorResponse activateVendor(UUID vendorId) {
        Vendor vendor = findVendor(vendorId);
        vendor.setActive(true);
        return toResponse(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorResponse deactivateVendor(UUID vendorId) {
        Vendor vendor = findVendor(vendorId);
        vendor.setActive(false);
        return toResponse(vendorRepository.save(vendor));
    }

    private Vendor findVendor(UUID vendorId) {
        return vendorRepository.findById(vendorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.VENDOR_NOT_FOUND,
                        "Vendor not found"));
    }

    private VendorResponse toResponse(Vendor vendor) {
        List<VendorResponse.SubVendorItem> subVendorItems = vendor.getSubVendors().stream()
                .map(sv -> new VendorResponse.SubVendorItem(sv.getId(), sv.getName(), sv.getCompanyName(), sv.getContactNo()))
                .toList();

        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getCompanyName(),
                vendor.getMobileNo(),
                vendor.getEmail(),
                vendor.isActive(),
                vendor.getCreatedAt(),
                subVendorItems);
    }
}
