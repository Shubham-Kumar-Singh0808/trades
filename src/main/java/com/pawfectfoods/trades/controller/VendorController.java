package com.pawfectfoods.trades.controller;

import com.pawfectfoods.trades.dto.CreateVendorRequest;
import com.pawfectfoods.trades.dto.VendorProfileChangeRequestResponse;
import com.pawfectfoods.trades.dto.VendorProfileChangeSubmitRequest;
import com.pawfectfoods.trades.dto.VendorRegistrationDecisionRequest;
import com.pawfectfoods.trades.dto.VendorResponse;
import com.pawfectfoods.trades.model.ApprovalStatus;
import com.pawfectfoods.trades.service.VendorService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<VendorResponse> createVendor(@Valid @RequestBody CreateVendorRequest request) {
        return ResponseEntity.ok(vendorService.createVendor(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<Page<VendorResponse>> getAllVendors(
            @PageableDefault(sort = "name") Pageable pageable) {
        return ResponseEntity.ok(vendorService.getAllVendors(pageable));
    }

    @GetMapping("/registration-requests")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<Page<VendorResponse>> getRegistrationRequests(
            @PageableDefault(sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(vendorService.getRegistrationRequests(pageable));
    }

    @PatchMapping("/{id}/registration/approve")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<VendorResponse> approveRegistration(@PathVariable UUID id) {
        return ResponseEntity.ok(vendorService.approveRegistration(id));
    }

    @PatchMapping("/{id}/registration/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> rejectRegistration(
            @PathVariable UUID id,
            @RequestBody(required = false) VendorRegistrationDecisionRequest request) {
        return ResponseEntity.ok(vendorService.rejectRegistration(id, request == null ? null : request.reason()));
    }

    @PostMapping("/me/change-request")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorProfileChangeRequestResponse> submitProfileChangeRequest(
            @Valid @RequestBody VendorProfileChangeSubmitRequest request) {
        return ResponseEntity.ok(vendorService.submitProfileChangeRequest(request));
    }

    @GetMapping("/change-requests")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<Page<VendorProfileChangeRequestResponse>> getProfileChangeRequests(
            @PageableDefault(sort = "requestedAt") Pageable pageable,
            @RequestParam(value = "status", required = false) ApprovalStatus status) {
        return ResponseEntity.ok(vendorService.getProfileChangeRequests(pageable, status));
    }

    @PatchMapping("/change-requests/{requestId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<VendorProfileChangeRequestResponse> approveProfileChangeRequest(
            @PathVariable UUID requestId,
            @RequestBody(required = false) VendorRegistrationDecisionRequest request) {
        return ResponseEntity.ok(vendorService.approveProfileChangeRequest(
                requestId,
                request == null ? null : request.reason()));
    }

    @PatchMapping("/change-requests/{requestId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<VendorProfileChangeRequestResponse> rejectProfileChangeRequest(
            @PathVariable UUID requestId,
            @RequestBody(required = false) VendorRegistrationDecisionRequest request) {
        return ResponseEntity.ok(vendorService.rejectProfileChangeRequest(
                requestId,
                request == null ? null : request.reason()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<VendorResponse> getVendorById(@PathVariable UUID id) {
        return ResponseEntity.ok(vendorService.getVendorById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> updateVendor(
            @PathVariable UUID id,
            @Valid @RequestBody CreateVendorRequest request) {
        return ResponseEntity.ok(vendorService.updateVendor(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVendor(@PathVariable UUID id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> activateVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(vendorService.activateVendor(id));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> deactivateVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(vendorService.deactivateVendor(id));
    }
}
