package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.ContactPersonRequest;
import com.pawfectfoods.trades.dto.CreateVendorRequest;
import com.pawfectfoods.trades.dto.VendorProfileChangeRequestResponse;
import com.pawfectfoods.trades.dto.VendorProfileChangeSubmitRequest;
import com.pawfectfoods.trades.dto.VendorResponse;
import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import com.pawfectfoods.trades.model.AccountTokenPurpose;
import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.ApprovalStatus;
import com.pawfectfoods.trades.model.EmailVerificationToken;
import com.pawfectfoods.trades.model.Role;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.model.VendorContactPerson;
import com.pawfectfoods.trades.model.VendorProfileChangeRequest;
import com.pawfectfoods.trades.model.VendorStatus;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.EmailVerificationTokenRepository;
import com.pawfectfoods.trades.repository.RoleRepository;
import com.pawfectfoods.trades.repository.VendorContactPersonRepository;
import com.pawfectfoods.trades.repository.VendorProfileChangeRequestRepository;
import com.pawfectfoods.trades.repository.VendorRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorContactPersonRepository vendorContactPersonRepository;
    private final VendorProfileChangeRequestRepository vendorProfileChangeRequestRepository;
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
                .registrationStatus(VendorStatus.APPROVED)
                .approvedAt(Instant.now())
                .approvedBy(currentUserEmail())
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

    @Transactional(readOnly = true)
    public Page<VendorResponse> getRegistrationRequests(Pageable pageable) {
        AppUser currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ADMIN);
        if (isAdmin) {
            return vendorRepository.findByRegistrationStatus(VendorStatus.PENDING_APPROVAL, pageable).map(this::toResponse);
        }

        return vendorRepository
            .findByRegistrationStatusAndExecutiveApprovedFalseOrRegistrationStatusAndExecutiveApprovedIsNull(
                VendorStatus.PENDING_APPROVAL,
                VendorStatus.PENDING_APPROVAL,
                pageable)
            .map(this::toResponse);
    }

    @Transactional
    public VendorResponse approveRegistration(UUID vendorId) {
        Vendor vendor = findVendor(vendorId);

        AppUser currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ADMIN);
        boolean isExecutive = currentUser.getRoles().stream().anyMatch(role -> role.getName() == RoleName.EXECUTIVE);

        if (!isAdmin && !isExecutive) {
            throw new BusinessException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN,
                    "Only admin or executive can approve vendor registration");
        }

        if (isExecutive && !isAdmin) {
            if (vendor.getRegistrationStatus() != VendorStatus.PENDING_APPROVAL) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.VENDOR_REGISTRATION_NOT_PENDING,
                        "Only pending registrations can be approved by executive");
            }

            if (Boolean.TRUE.equals(vendor.getExecutiveApproved())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.VENDOR_REGISTRATION_NOT_PENDING,
                        "Vendor registration is already approved by executive and pending admin final approval");
            }

            vendor.setExecutiveApproved(Boolean.TRUE);
            vendor.setExecutiveApprovedAt(Instant.now());
            vendor.setExecutiveApprovedBy(currentUser.getEmail());
            vendor.setRejectionReason(null);
            return toResponse(vendorRepository.save(vendor));
        }

        if (vendor.getRegistrationStatus() != VendorStatus.PENDING_APPROVAL) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.VENDOR_REGISTRATION_NOT_PENDING,
                    "Vendor registration is not pending admin approval");
        }

        Role vendorRole = roleRepository.findByName(RoleName.VENDOR)
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR,
                        ErrorCode.INTERNAL_SERVER_ERROR, "Default role VENDOR is not initialized"));

        String passwordHash = vendor.getPendingPasswordHash();
        if (passwordHash == null || passwordHash.isBlank()) {
            passwordHash = passwordEncoder.encode(UUID.randomUUID().toString());
        }

        AppUser existingUser = appUserRepository.findFirstByEmailIgnoreCase(vendor.getEmail()).orElse(null);
        if (existingUser != null) {
            boolean hasVendorRole = existingUser.getRoles().stream().anyMatch(role -> role.getName() == RoleName.VENDOR);
            if (!hasVendorRole) {
                throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                        "User with this email already exists with non-vendor role");
            }

            existingUser.setName(vendor.getName());
            existingUser.setMobileNo(vendor.getMobileNo());
            existingUser.setCompanyName(vendor.getCompanyName());
            existingUser.setEnabled(true);
            existingUser.setEmailVerified(true);
            if (!existingUser.getEmail().equals(vendor.getEmail())) {
                existingUser.setEmail(vendor.getEmail());
            }
            appUserRepository.save(existingUser);
        } else {
            AppUser user = AppUser.builder()
                    .email(vendor.getEmail())
                    .password(passwordHash)
                    .name(vendor.getName())
                    .mobileNo(vendor.getMobileNo())
                    .companyName(vendor.getCompanyName())
                    .enabled(true)
                    .emailVerified(true)
                    .roles(Set.of(vendorRole))
                    .build();
            try {
                appUserRepository.save(user);
            } catch (DataIntegrityViolationException ex) {
                throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                        "User with this vendor email already exists");
            }
        }

        vendor.setActive(true);
        vendor.setRegistrationStatus(VendorStatus.APPROVED);
        vendor.setExecutiveApproved(Boolean.FALSE);
        vendor.setExecutiveApprovedAt(null);
        vendor.setExecutiveApprovedBy(null);
        vendor.setApprovedAt(Instant.now());
        vendor.setApprovedBy(currentUserEmail());
        vendor.setRejectionReason(null);
        vendor.setPendingPasswordHash(null);

        Vendor savedVendor = vendorRepository.save(vendor);
        emailService.sendVendorApprovedEmail(savedVendor.getEmail(), savedVendor.getName());

        return toResponse(savedVendor);
    }

    @Transactional
    public VendorResponse rejectRegistration(UUID vendorId, String reason) {
        Vendor vendor = findVendor(vendorId);
        if (vendor.getRegistrationStatus() != VendorStatus.PENDING_APPROVAL) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.VENDOR_REGISTRATION_NOT_PENDING,
                    "Vendor registration is not pending approval");
        }

        String rejectionReason = (reason == null || reason.isBlank())
                ? "Vendor registration rejected by admin"
                : reason.trim();

        vendor.setActive(false);
        vendor.setRegistrationStatus(VendorStatus.REJECTED);
        vendor.setExecutiveApproved(Boolean.FALSE);
        vendor.setExecutiveApprovedAt(null);
        vendor.setExecutiveApprovedBy(null);
        vendor.setRejectionReason(rejectionReason);
        vendor.setApprovedAt(null);
        vendor.setApprovedBy(null);

        Vendor savedVendor = vendorRepository.save(vendor);
        emailService.sendVendorRejectedEmail(savedVendor.getEmail(), savedVendor.getName(), rejectionReason);
        return toResponse(savedVendor);
    }

    @Transactional
    public VendorProfileChangeRequestResponse submitProfileChangeRequest(VendorProfileChangeSubmitRequest request) {
        AppUser currentUser = getCurrentUser();
        boolean isVendor = currentUser.getRoles().stream().anyMatch(role -> role.getName() == RoleName.VENDOR);
        if (!isVendor) {
            throw new BusinessException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN,
                    "Only vendor users can submit vendor profile change requests");
        }

        Vendor vendor = vendorRepository.findByEmail(currentUser.getEmail())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.VENDOR_NOT_FOUND,
                        "Vendor not found for current user"));

        vendorProfileChangeRequestRepository
                .findFirstByVendorIdAndStatusOrderByRequestedAtDesc(vendor.getId(), ApprovalStatus.PENDING)
                .ifPresent(existing -> {
                    throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.VENDOR_CHANGE_REQUEST_ALREADY_PENDING,
                            "A profile change request is already pending approval");
                });

        if (!vendor.getEmail().equalsIgnoreCase(request.email())
                && (vendorRepository.existsByEmailAndIdNot(request.email(), vendor.getId())
                || appUserRepository.existsByEmail(request.email()))) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                    "Requested email is already in use");
        }

        List<ContactPersonRequest> contacts = request.contactPersons();
        VendorProfileChangeRequest changeRequest = VendorProfileChangeRequest.builder()
                .vendor(vendor)
                .requestedName(request.name())
                .requestedEmail(request.email())
                .requestedOfficeAddress(request.officeAddress())
                .contact1Name(contacts.get(0).name())
                .contact1Designation(contacts.get(0).designation())
                .contact1Email(contacts.get(0).email())
                .contact1Phone(contacts.get(0).phone())
                .contact2Name(contacts.get(1).name())
                .contact2Designation(contacts.get(1).designation())
                .contact2Email(contacts.get(1).email())
                .contact2Phone(contacts.get(1).phone())
                .contact3Name(contacts.get(2).name())
                .contact3Designation(contacts.get(2).designation())
                .contact3Email(contacts.get(2).email())
                .contact3Phone(contacts.get(2).phone())
                .status(ApprovalStatus.PENDING)
                .requestedAt(Instant.now())
                .requestedBy(currentUser.getEmail())
                .build();

        VendorProfileChangeRequest saved = vendorProfileChangeRequestRepository.save(changeRequest);

        List<String> recipients = getApproverEmails();
        emailService.sendVendorProfileChangeSubmittedEmail(recipients, vendor.getName(), vendor.getEmail());

        return toProfileChangeResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<VendorProfileChangeRequestResponse> getProfileChangeRequests(Pageable pageable, ApprovalStatus status) {
        if (status == null) {
            return vendorProfileChangeRequestRepository.findAll(pageable).map(this::toProfileChangeResponse);
        }
        return vendorProfileChangeRequestRepository.findByStatus(status, pageable).map(this::toProfileChangeResponse);
    }

    @Transactional
    public VendorProfileChangeRequestResponse approveProfileChangeRequest(UUID requestId, String remarks) {
        VendorProfileChangeRequest changeRequest = findProfileChangeRequest(requestId);
        if (changeRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST,
                    "Only pending profile change requests can be approved");
        }

        Vendor vendor = changeRequest.getVendor();
        String oldEmail = vendor.getEmail();
        String requestedEmail = changeRequest.getRequestedEmail();

        if (!oldEmail.equalsIgnoreCase(requestedEmail)
                && (vendorRepository.existsByEmailAndIdNot(requestedEmail, vendor.getId())
                || appUserRepository.findByEmail(requestedEmail)
                        .filter(existing -> !existing.getEmail().equalsIgnoreCase(oldEmail))
                        .isPresent())) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                    "Requested email is already in use");
        }

        vendor.setName(changeRequest.getRequestedName());
        vendor.setEmail(requestedEmail);
        vendor.setOfficeAddress(changeRequest.getRequestedOfficeAddress());
        vendor.setMobileNo(changeRequest.getContact1Phone());

        vendorContactPersonRepository.deleteByVendorId(vendor.getId());
        vendorContactPersonRepository.saveAll(buildContactPeopleForVendor(vendor, requestedContacts(changeRequest)));

        vendorRepository.save(vendor);

        appUserRepository.findByEmail(oldEmail).ifPresent(user -> {
            user.setEmail(vendor.getEmail());
            user.setName(vendor.getName());
            user.setMobileNo(vendor.getMobileNo());
            user.setCompanyName(vendor.getCompanyName());
            appUserRepository.save(user);
        });

        changeRequest.setStatus(ApprovalStatus.APPROVED);
        changeRequest.setReviewedAt(Instant.now());
        changeRequest.setReviewedBy(currentUserEmail());
        changeRequest.setReviewRemarks(remarks);

        VendorProfileChangeRequest saved = vendorProfileChangeRequestRepository.save(changeRequest);
        emailService.sendVendorProfileChangeApprovedEmail(vendor.getEmail(), vendor.getName());

        return toProfileChangeResponse(saved);
    }

    @Transactional
    public VendorProfileChangeRequestResponse rejectProfileChangeRequest(UUID requestId, String reason) {
        VendorProfileChangeRequest changeRequest = findProfileChangeRequest(requestId);
        if (changeRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST,
                    "Only pending profile change requests can be rejected");
        }

        changeRequest.setStatus(ApprovalStatus.REJECTED);
        changeRequest.setReviewedAt(Instant.now());
        changeRequest.setReviewedBy(currentUserEmail());
        changeRequest.setReviewRemarks(reason);

        VendorProfileChangeRequest saved = vendorProfileChangeRequestRepository.save(changeRequest);
        emailService.sendVendorProfileChangeRejectedEmail(
                changeRequest.getVendor().getEmail(),
                changeRequest.getVendor().getName(),
                reason == null || reason.isBlank() ? "Request rejected" : reason);

        return toProfileChangeResponse(saved);
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

    private VendorProfileChangeRequest findProfileChangeRequest(UUID requestId) {
        return vendorProfileChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.VENDOR_CHANGE_REQUEST_NOT_FOUND,
                        "Vendor profile change request not found"));
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated");
        }

        return appUserRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED,
                        ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated"));
    }

    private String currentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return "system";
        }
        return authentication.getName();
    }

    private List<String> getApproverEmails() {
        List<String> emails = new ArrayList<>();
        appUserRepository.findDistinctByRoles_Name(RoleName.ADMIN)
                .forEach(user -> emails.add(user.getEmail()));
        appUserRepository.findDistinctByRoles_Name(RoleName.EXECUTIVE)
                .forEach(user -> {
                    if (!emails.contains(user.getEmail())) {
                        emails.add(user.getEmail());
                    }
                });
        return emails;
    }

    private List<ContactPersonRequest> requestedContacts(VendorProfileChangeRequest request) {
        return List.of(
                new ContactPersonRequest(request.getContact1Name(), request.getContact1Designation(), request.getContact1Email(),
                        request.getContact1Phone()),
                new ContactPersonRequest(request.getContact2Name(), request.getContact2Designation(), request.getContact2Email(),
                        request.getContact2Phone()),
                new ContactPersonRequest(request.getContact3Name(), request.getContact3Designation(), request.getContact3Email(),
                        request.getContact3Phone())
        );
    }

    private List<VendorContactPerson> buildContactPeopleForVendor(Vendor vendor, List<ContactPersonRequest> contacts) {
        return contacts.stream().map(contact -> VendorContactPerson.builder()
                .vendor(vendor)
                .name(contact.name())
                .designation(contact.designation())
                .email(contact.email())
                .phone(contact.phone())
                .build()).toList();
    }

    private VendorProfileChangeRequestResponse toProfileChangeResponse(VendorProfileChangeRequest request) {
        Vendor vendor = request.getVendor();
        return new VendorProfileChangeRequestResponse(
                request.getId(),
                vendor.getId(),
                vendor.getName(),
                vendor.getEmail(),
                vendor.getOfficeAddress(),
                request.getRequestedName(),
                request.getRequestedEmail(),
                request.getRequestedOfficeAddress(),
                requestedContacts(request),
                request.getStatus(),
                request.getRequestedAt(),
                request.getRequestedBy(),
                request.getReviewedBy(),
                request.getReviewedAt(),
                request.getReviewRemarks());
    }

    private VendorResponse toResponse(Vendor vendor) {
        List<VendorResponse.ContactPersonItem> contactPersonItems = vendor.getContactPersons().stream()
                .map(cp -> new VendorResponse.ContactPersonItem(cp.getId(), cp.getName(), cp.getDesignation(), cp.getEmail(), cp.getPhone()))
                .toList();

        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getCompanyName(),
                vendor.getGstNo(),
                vendor.getRegisteredAddress(),
            vendor.getGstStatus(),
            vendor.getGstActive(),
                vendor.getOfficeAddress(),
                vendor.getMobileNo(),
                vendor.getEmail(),
                vendor.isActive(),
                vendor.getRegistrationStatus(),
            Boolean.TRUE.equals(vendor.getExecutiveApproved()),
            vendor.getExecutiveApprovedAt(),
            vendor.getExecutiveApprovedBy(),
                vendor.getRejectionReason(),
                vendor.getCreatedAt(),
                contactPersonItems);
    }
}
