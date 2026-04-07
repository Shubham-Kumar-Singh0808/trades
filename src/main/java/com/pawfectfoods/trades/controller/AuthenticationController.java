package com.pawfectfoods.trades.controller;

import com.pawfectfoods.trades.dto.AuthResponse;
import com.pawfectfoods.trades.dto.ForgotPasswordRequest;
import com.pawfectfoods.trades.dto.LoginRequest;
import com.pawfectfoods.trades.dto.MessageResponse;
import com.pawfectfoods.trades.dto.RegisterRequest;
import com.pawfectfoods.trades.dto.ResetPasswordRequest;
import com.pawfectfoods.trades.dto.SetPasswordRequest;
import com.pawfectfoods.trades.dto.SessionResponse;
import com.pawfectfoods.trades.dto.UpdateProfileRequest;
import com.pawfectfoods.trades.dto.VendorRegistrationRequest;
import com.pawfectfoods.trades.service.AuthService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.pawfectfoods.trades.security.JwtFilter;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthService authService;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.frontend.base-url:http://localhost:4000}")
    private String frontendBaseUrl;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/vendor/register")
    public ResponseEntity<MessageResponse> registerVendor(@Valid @RequestBody VendorRegistrationRequest request) {
        return ResponseEntity.ok(authService.registerVendor(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);

        ResponseCookie jwtCookie = ResponseCookie.from(JwtFilter.AUTH_COOKIE_NAME, authResponse.token())
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(jwtExpirationMs / 1000)
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
            .body(authResponse);
    }

        @PostMapping("/logout")
        public ResponseEntity<MessageResponse> logout() {
        ResponseCookie clearCookie = ResponseCookie.from(JwtFilter.AUTH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(0)
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
            .body(new MessageResponse("Logged out successfully"));
        }

    @GetMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @GetMapping("/activate-account")
    public ResponseEntity<Void> activateAccount(@RequestParam("token") String token) {
        try {
            authService.verifyEmail(token);
            URI successUri = URI.create(frontendBaseUrl + "/login?activation=success");
            return ResponseEntity.status(HttpStatus.FOUND).location(successUri).build();
        } catch (ResponseStatusException ex) {
            URI failureUri = URI.create(frontendBaseUrl + "/login?activation=failed");
            return ResponseEntity.status(HttpStatus.FOUND).location(failureUri).build();
        }
    }

    @PostMapping("/setup-password")
    public ResponseEntity<MessageResponse> setupPassword(@Valid @RequestBody SetPasswordRequest request) {
        return ResponseEntity.ok(authService.setupVendorPassword(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SessionResponse> me() {
        return ResponseEntity.ok(authService.getCurrentSession());
    }

    @PostMapping("/me/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SessionResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateCurrentProfile(request));
    }
}
