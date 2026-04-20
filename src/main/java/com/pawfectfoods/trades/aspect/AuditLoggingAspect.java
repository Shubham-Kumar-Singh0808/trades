package com.pawfectfoods.trades.aspect;

import com.pawfectfoods.trades.model.AuditLog;
import com.pawfectfoods.trades.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditLoggingAspect {

    private final AuditLogService auditLogService;

    @Around("execution(* com.pawfectfoods.trades.controller..*(..))")
    public Object logApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
        HttpServletResponse response = attributes != null ? attributes.getResponse() : null;
        Signature signature = joinPoint.getSignature();

        int statusCode = 200;

        try {
            Object result = joinPoint.proceed();
            if (response != null) {
                statusCode = response.getStatus();
            }
            return result;
        } catch (Throwable ex) {
            if (ex instanceof ResponseStatusException rse) {
                statusCode = rse.getStatusCode().value();
            } else {
                statusCode = 500;
            }
            throw ex;
        } finally {
            try {
                AuditLog log = AuditLog.builder()
                        .username(resolveUsername())
                        .endpoint(request != null ? request.getRequestURI() : "unknown")
                        .httpMethod(request != null ? request.getMethod() : "unknown")
                        .actionMessage(resolveActionMessage(request, signature))
                        .timestamp(Instant.now())
                        .statusCode(statusCode)
                        .build();
                auditLogService.save(log);
            } catch (Exception ignored) {
                // Never block API execution if audit persistence fails.
            }
        }
    }

    private String resolveUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "ANONYMOUS";
        }
        return authentication.getName();
    }

    private String resolveActionMessage(HttpServletRequest request, Signature signature) {
        String endpoint = request != null ? request.getRequestURI() : "unknown";
        String method = request != null ? request.getMethod() : "unknown";

        return switch (signature.getDeclaringTypeName() + "#" + signature.getName()) {
            case "com.pawfectfoods.trades.controller.AuthenticationController#register" ->
                    "User registration requested";
            case "com.pawfectfoods.trades.controller.AuthenticationController#verifyEmail" ->
                    "Email verification completed";
            case "com.pawfectfoods.trades.controller.AuthenticationController#login" ->
                    "User login successful";
            case "com.pawfectfoods.trades.controller.AdminUserController#createUser" ->
                    "Admin created a user account";
            case "com.pawfectfoods.trades.controller.AdminUserController#assignRoles" ->
                    "Admin updated user roles";
            case "com.pawfectfoods.trades.controller.AdminUserController#setStatus" ->
                    "Admin changed user enabled status";
            case "com.pawfectfoods.trades.controller.AdminUserController#getUsers" ->
                    "Admin fetched users list";
            case "com.pawfectfoods.trades.controller.VendorController#createVendor" ->
                    "Vendor created";
            case "com.pawfectfoods.trades.controller.TradeController#createTrade" ->
                    "Trade created";
            default -> method + " " + endpoint + " invoked";
        };
    }
}
