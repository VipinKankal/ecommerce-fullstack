package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.common.response.ApiErrorCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
public class DomainException extends RuntimeException {

    private final HttpStatus status;
    private final ApiErrorCode errorCode;
    private final String reasonCode;
    private final Map<String, Object> details;

    public DomainException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message
    ) {
        this(status, errorCode, reasonCode, message, Map.of());
    }

    public DomainException(
            HttpStatus status,
            ApiErrorCode errorCode,
            String reasonCode,
            String message,
            Map<String, Object> details
    ) {
        super(message);
        this.status = status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status;
        this.errorCode = errorCode == null ? ApiErrorCode.INTERNAL_ERROR : errorCode;
        this.reasonCode = reasonCode;
        this.details = details == null || details.isEmpty()
                ? Map.of()
                : Map.copyOf(new LinkedHashMap<>(details));
    }
}
