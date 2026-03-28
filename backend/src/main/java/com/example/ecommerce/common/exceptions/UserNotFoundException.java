package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.common.response.ApiErrorCode;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class UserNotFoundException extends DomainException {

    public static final String REASON_NOT_FOUND = "USER_NOT_FOUND";

    public UserNotFoundException(String message) {
        this(message, Map.of());
    }

    public UserNotFoundException(String message, Map<String, Object> details) {
        super(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                REASON_NOT_FOUND,
                message,
                details
        );
    }

    public static UserNotFoundException byId(Long userId) {
        return new UserNotFoundException(
                "User not found with id " + userId,
                Map.of("userId", userId)
        );
    }

    public static UserNotFoundException byEmail(String email) {
        return new UserNotFoundException(
                "User not found with email " + email,
                Map.of("email", email)
        );
    }
}

