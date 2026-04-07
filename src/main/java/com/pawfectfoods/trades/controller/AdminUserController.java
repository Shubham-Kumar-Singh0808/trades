package com.pawfectfoods.trades.controller;

import com.pawfectfoods.trades.dto.CreateUserRequest;
import com.pawfectfoods.trades.dto.UpdateUserRequest;
import com.pawfectfoods.trades.dto.UpdateRolesRequest;
import com.pawfectfoods.trades.dto.UpdateUserStatusRequest;
import com.pawfectfoods.trades.dto.UserResponse;
import com.pawfectfoods.trades.service.AdminUserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(adminUserService.createUser(request));
    }

    @PutMapping("/{userId}/roles")
    public ResponseEntity<UserResponse> assignRoles(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateRolesRequest request) {
        return ResponseEntity.ok(adminUserService.assignRoles(userId, request.roles()));
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<UserResponse> setStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminUserService.setEnabled(userId, request.enabled()));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(adminUserService.updateUser(userId, request));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        adminUserService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getUsers(
            @PageableDefault(sort = "email") Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getAllUsers(pageable));
    }
}
