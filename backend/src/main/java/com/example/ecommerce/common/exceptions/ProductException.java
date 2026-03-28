package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.common.response.ApiErrorCode;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class ProductException extends DomainException {

    public static final String REASON_NOT_FOUND = "PRODUCT_NOT_FOUND";
    public static final String REASON_ACCESS_DENIED = "PRODUCT_ACCESS_DENIED";
    public static final String REASON_ACTIVE_ORDER_CONFLICT = "PRODUCT_ACTIVE_ORDER_CONFLICT";
    public static final String REASON_VALIDATION = "PRODUCT_VALIDATION_FAILED";

    public ProductException(String message) {
        this(HttpStatus.UNPROCESSABLE_ENTITY, ApiErrorCode.VALIDATION_ERROR, REASON_VALIDATION, message);
    }

    public ProductException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message
    ) {
        super(status, errorCode, reasonCode, message);
    }

    public ProductException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message,
            Map<String, Object> details
    ) {
        super(status, errorCode, reasonCode, message, details);
    }

    public static ProductException notFound(Long productId) {
        return new ProductException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                REASON_NOT_FOUND,
                "Product not found with id " + productId,
                Map.of("productId", productId)
        );
    }

    public static ProductException unauthorizedAccess(Long productId, Long sellerId) {
        return new ProductException(
                HttpStatus.FORBIDDEN,
                ApiErrorCode.ACCESS_DENIED,
                REASON_ACCESS_DENIED,
                "Unauthorized product access",
                Map.of("productId", productId, "sellerId", sellerId)
        );
    }

    public static ProductException activeOrderConflict(Long productId) {
        return new ProductException(
                HttpStatus.CONFLICT,
                ApiErrorCode.DUPLICATE_RESOURCE,
                REASON_ACTIVE_ORDER_CONFLICT,
                "Product cannot be deleted while active orders exist",
                Map.of("productId", productId)
        );
    }
}

