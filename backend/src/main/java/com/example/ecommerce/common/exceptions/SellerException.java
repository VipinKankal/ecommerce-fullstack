package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.common.response.ApiErrorCode;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class SellerException extends DomainException {

    public static final String REASON_NOT_FOUND = "SELLER_NOT_FOUND";
    public static final String REASON_CONFLICT = "SELLER_CONFLICT";
    public static final String REASON_VALIDATION = "SELLER_VALIDATION_FAILED";

    public SellerException(String message) {
        this(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, REASON_NOT_FOUND, message);
    }

    public SellerException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message
    ) {
        super(status, errorCode, reasonCode, message);
    }

    public SellerException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message,
            Map<String, Object> details
    ) {
        super(status, errorCode, reasonCode, message, details);
    }

    public static SellerException notFound(Long sellerId) {
        return new SellerException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                REASON_NOT_FOUND,
                "Seller not found with id " + sellerId,
                Map.of("sellerId", sellerId)
        );
    }
}

