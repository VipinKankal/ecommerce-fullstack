package com.example.ecommerce.order.exception;

import com.example.ecommerce.common.response.ApiErrorCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

@Getter
public class CouponOperationException extends RuntimeException {

    private final HttpStatus status;
    private final ApiErrorCode errorCode;
    private final String reasonCode;
    private final Map<String, Object> details;

    public CouponOperationException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message
    ) {
        this(status, errorCode, reasonCode, message, Map.of());
    }

    public CouponOperationException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message,
            Map<String, Object> details
    ) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.reasonCode = reasonCode;
        this.details = details == null ? Map.of() : details;
    }
}

