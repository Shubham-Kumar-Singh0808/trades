package com.pawfectfoods.trades.error;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request) {

        return build(ex.getStatus(), ex.getCode(), ex.getMessage(), request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> details = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            details.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED,
                "Validation failed for request payload", request.getRequestURI(), details);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request) {

        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        ErrorCode code = mapStatusToCode(status, ex.getReason());

        return build(status, code, ex.getReason(), request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest request) {

        return build(HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_INVALID_CREDENTIALS,
                "Invalid email or password", request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(
            AuthenticationException ex,
            HttpServletRequest request) {

        return build(HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_INVALID_CREDENTIALS,
                "Authentication failed", request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        return build(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN,
                "You are not authorized to access this resource", request.getRequestURI(), Map.of());
    }

            @ExceptionHandler(DataIntegrityViolationException.class)
            public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
                DataIntegrityViolationException ex,
                HttpServletRequest request) {

            return build(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                "Request conflicts with existing data", request.getRequestURI(), Map.of());
            }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(
            Exception ex,
            HttpServletRequest request) {

        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred", request.getRequestURI(), Map.of());
    }

    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status,
            ErrorCode code,
            String message,
            String path,
            Map<String, String> details) {

        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code.name(),
                message,
                path,
                details);

        return ResponseEntity.status(status).body(body);
    }

    private ErrorCode mapStatusToCode(HttpStatus status, String message) {
        if (status == HttpStatus.FORBIDDEN && message != null) {
            if (message.toLowerCase().contains("not allowed to login")) {
                return ErrorCode.AUTH_USER_DISABLED;
            }
            if (message.toLowerCase().contains("not verified")) {
                return ErrorCode.AUTH_EMAIL_NOT_VERIFIED;
            }
        }

        return switch (status) {
            case CONFLICT -> ErrorCode.CONFLICT;
            case NOT_FOUND -> ErrorCode.NOT_FOUND;
            case BAD_REQUEST -> ErrorCode.BAD_REQUEST;
            case FORBIDDEN -> ErrorCode.FORBIDDEN;
            default -> ErrorCode.INTERNAL_SERVER_ERROR;
        };
    }
}
