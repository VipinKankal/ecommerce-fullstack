package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.common.response.ApiErrorCode;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class AuthException extends DomainException {

    public static final String REASON_SELLER_NOT_REGISTERED = "SELLER_NOT_REGISTERED";
    public static final String REASON_CUSTOMER_NOT_REGISTERED = "CUSTOMER_NOT_REGISTERED";
    public static final String REASON_INVALID_OTP = "INVALID_OTP";
    public static final String REASON_OTP_EXPIRED = "OTP_EXPIRED";
    public static final String REASON_OTP_ALREADY_USED = "OTP_ALREADY_USED";
    public static final String REASON_OTP_ATTEMPT_LIMIT_EXCEEDED = "OTP_ATTEMPT_LIMIT_EXCEEDED";
    public static final String REASON_OTP_RATE_LIMIT_EXCEEDED = "OTP_RATE_LIMIT_EXCEEDED";
    public static final String REASON_INVALID_CREDENTIALS = "INVALID_CREDENTIALS";

    public AuthException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message
    ) {
        super(status, errorCode, reasonCode, message);
    }

    public AuthException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message,
            Map<String, Object> details
    ) {
        super(status, errorCode, reasonCode, message, details);
    }

    public static AuthException sellerNotRegistered(String email, String message) {
        return new AuthException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                REASON_SELLER_NOT_REGISTERED,
                message,
                email == null ? Map.of() : Map.of("email", email)
        );
    }

    public static AuthException customerNotRegistered(String email, String message) {
        return new AuthException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                REASON_CUSTOMER_NOT_REGISTERED,
                message,
                email == null ? Map.of() : Map.of("email", email)
        );
    }

    public static AuthException invalidOtp() {
        return new AuthException(
                HttpStatus.UNAUTHORIZED,
                ApiErrorCode.INVALID_CREDENTIALS,
                REASON_INVALID_OTP,
                "Invalid OTP"
        );
    }

    public static AuthException otpExpired() {
        return new AuthException(
                HttpStatus.UNAUTHORIZED,
                ApiErrorCode.INVALID_CREDENTIALS,
                REASON_OTP_EXPIRED,
                "OTP expired"
        );
    }

    public static AuthException otpAlreadyUsed() {
        return new AuthException(
                HttpStatus.UNAUTHORIZED,
                ApiErrorCode.INVALID_CREDENTIALS,
                REASON_OTP_ALREADY_USED,
                "OTP already used"
        );
    }

    public static AuthException otpAttemptLimitExceeded() {
        return new AuthException(
                HttpStatus.TOO_MANY_REQUESTS,
                ApiErrorCode.RATE_LIMIT_EXCEEDED,
                REASON_OTP_ATTEMPT_LIMIT_EXCEEDED,
                "Maximum OTP attempts exceeded"
        );
    }

    public static AuthException otpRateLimitExceeded(String message) {
        return new AuthException(
                HttpStatus.TOO_MANY_REQUESTS,
                ApiErrorCode.RATE_LIMIT_EXCEEDED,
                REASON_OTP_RATE_LIMIT_EXCEEDED,
                message == null || message.isBlank() ? "Too many OTP requests. Try again later." : message
        );
    }

    public static AuthException invalidCredentials() {
        return new AuthException(
                HttpStatus.UNAUTHORIZED,
                ApiErrorCode.INVALID_CREDENTIALS,
                REASON_INVALID_CREDENTIALS,
                "Invalid credentials"
        );
    }
}
