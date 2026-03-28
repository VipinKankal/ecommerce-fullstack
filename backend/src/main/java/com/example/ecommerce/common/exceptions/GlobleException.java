package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.catalog.ProductConstraints;
import com.example.ecommerce.common.response.ApiEnvelope;
import com.example.ecommerce.common.response.ApiEnvelopeFactory;
import com.example.ecommerce.common.response.ApiErrorCode;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.razorpay.RazorpayException;
import com.stripe.exception.StripeException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
public class GlobleException {

    private ResponseEntity<ApiEnvelope<Void>> buildErrorResponse(
            HttpStatus status,
            String message,
            ApiErrorCode code,
            Object details
    ) {
        return new ResponseEntity<>(
                ApiEnvelopeFactory.error(status, message, code, details),
                status
        );
    }

    private ResponseEntity<ApiEnvelope<Void>> buildErrorResponse(
            HttpStatus status,
            String message,
            ApiErrorCode code,
            WebRequest request
    ) {
        return buildErrorResponse(status, message, code, baseDetails(request));
    }

    private Map<String, Object> baseDetails(WebRequest request) {
        return ApiEnvelopeFactory.buildPathDetails(extractPath(request));
    }

    private String extractPath(WebRequest request) {
        String description = request.getDescription(false);
        return description.startsWith("uri=") ? description.substring(4) : description;
    }

    private LinkedHashMap<String, Object> detailsWithReason(
            WebRequest request,
            String reasonCode,
            Map<String, Object> extraDetails
    ) {
        LinkedHashMap<String, Object> details = new LinkedHashMap<>(baseDetails(request));
        if (reasonCode != null && !reasonCode.isBlank()) {
            details.put("reasonCode", reasonCode);
        }
        if (extraDetails != null && !extraDetails.isEmpty()) {
            details.putAll(extraDetails);
        }
        return details;
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiEnvelope<Void>> domainExceptionHandler(
            DomainException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                ex.getStatus(),
                ex.getMessage(),
                ex.getErrorCode(),
                detailsWithReason(request, ex.getReasonCode(), ex.getDetails())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiEnvelope<Void>> validationExceptionHandler(
            MethodArgumentNotValidException ex,
            WebRequest request
    ) {
        LinkedHashMap<String, String> fieldMessages = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            if (!fieldMessages.containsKey(fieldError.getField()) && fieldError.getDefaultMessage() != null) {
                fieldMessages.put(fieldError.getField(), fieldError.getDefaultMessage());
            }
        }

        String message = fieldMessages.values().stream().findFirst().orElse("Validation failed");
        LinkedHashMap<String, Object> details = new LinkedHashMap<>(baseDetails(request));
        details.put("fields", fieldMessages);

        return buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                message,
                ApiErrorCode.VALIDATION_ERROR,
                details
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiEnvelope<Void>> dataIntegrityViolationExceptionHandler(
            DataIntegrityViolationException ex,
            WebRequest request
    ) {
        String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        String normalized = message == null ? "" : message.toLowerCase();

        if (normalized.contains("data too long") && normalized.contains("description")) {
            return buildErrorResponse(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    ProductConstraints.DESCRIPTION_MAX_MESSAGE,
                    ApiErrorCode.VALIDATION_ERROR,
                    detailsWithReason(request, "PRODUCT_DESCRIPTION_TOO_LONG", Map.of())
            );
        }

        if (normalized.contains("duplicate")
                || normalized.contains("already")
                || normalized.contains("unique")
                || normalized.contains("constraint")) {
            return buildErrorResponse(
                    HttpStatus.CONFLICT,
                    "Resource already exists.",
                    ApiErrorCode.DUPLICATE_RESOURCE,
                    detailsWithReason(request, "DB_UNIQUE_CONSTRAINT", Map.of())
            );
        }

        return buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Request violates database constraints.",
                ApiErrorCode.VALIDATION_ERROR,
                detailsWithReason(request, "DB_CONSTRAINT_VIOLATION", Map.of())
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiEnvelope<Void>> illegalArgumentExceptionHandler(
            IllegalArgumentException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                ex.getMessage(),
                ApiErrorCode.VALIDATION_ERROR,
                detailsWithReason(request, "VALIDATION_FAILED", Map.of())
        );
    }

    @ExceptionHandler(CouponOperationException.class)
    public ResponseEntity<ApiEnvelope<Void>> couponOperationExceptionHandler(
            CouponOperationException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                ex.getStatus(),
                ex.getMessage(),
                ex.getErrorCode(),
                detailsWithReason(request, ex.getReasonCode(), ex.getDetails())
        );
    }

    @ExceptionHandler(RazorpayException.class)
    public ResponseEntity<ApiEnvelope<Void>> razorpayExceptionHandler(RazorpayException ex, WebRequest request) {
        String message = ex.getMessage() == null ? "Payment gateway error" : ex.getMessage();
        if (message.toLowerCase().contains("authentication failed")) {
            message = "Razorpay authentication failed. Check RAZORPAY_API_KEY and RAZORPAY_API_SECRET.";
        }

        return buildErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                message,
                ApiErrorCode.SERVICE_UNAVAILABLE,
                request
        );
    }

    @ExceptionHandler(StripeException.class)
    public ResponseEntity<ApiEnvelope<Void>> stripeExceptionHandler(StripeException ex, WebRequest request) {
        String message = ex.getMessage() == null ? "Payment gateway error" : ex.getMessage();
        return buildErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                message,
                ApiErrorCode.SERVICE_UNAVAILABLE,
                request
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiEnvelope<Void>> authenticationExceptionHandler(
            AuthenticationException ex,
            WebRequest request
    ) {
        if (ex instanceof BadCredentialsException) {
            return buildErrorResponse(
                    HttpStatus.UNAUTHORIZED,
                    ex.getMessage(),
                    ApiErrorCode.INVALID_CREDENTIALS,
                    detailsWithReason(request, "INVALID_CREDENTIALS", Map.of())
            );
        }

        return buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                ApiErrorCode.AUTH_REQUIRED,
                detailsWithReason(request, "AUTH_REQUIRED", Map.of())
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiEnvelope<Void>> accessDeniedExceptionHandler(
            AccessDeniedException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.FORBIDDEN,
                "You do not have permission to access this resource.",
                ApiErrorCode.ACCESS_DENIED,
                request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiEnvelope<Void>> httpMessageNotReadableExceptionHandler(
            HttpMessageNotReadableException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Malformed request body.",
                ApiErrorCode.VALIDATION_ERROR,
                request
        );
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiEnvelope<Void>> httpRequestMethodNotSupportedExceptionHandler(
            HttpRequestMethodNotSupportedException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.METHOD_NOT_ALLOWED,
                "Request method is not supported for this endpoint.",
                ApiErrorCode.VALIDATION_ERROR,
                request
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiEnvelope<Void>> noResourceFoundExceptionHandler(
            NoResourceFoundException ex,
            WebRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.NOT_FOUND,
                "Resource not found.",
                ApiErrorCode.RESOURCE_NOT_FOUND,
                request
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiEnvelope<Void>> genericExceptionHandler(Exception ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error",
                ApiErrorCode.INTERNAL_ERROR,
                detailsWithReason(request, "UNEXPECTED_ERROR", Map.of())
        );
    }

}
