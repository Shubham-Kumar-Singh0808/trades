package com.pawfectfoods.trades.controller;

import com.pawfectfoods.trades.dto.CreateVendorRequest;
import com.pawfectfoods.trades.dto.SubVendorRequest;
import com.pawfectfoods.trades.dto.VendorResponse;
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

    @PostMapping("/{id}/subvendors")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<VendorResponse> addSubVendor(
            @PathVariable UUID id,
            @Valid @RequestBody SubVendorRequest request) {
        return ResponseEntity.ok(vendorService.addSubVendor(id, request));
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
