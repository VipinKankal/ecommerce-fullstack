package com.example.ecommerce.common.exceptions;

import com.example.ecommerce.catalog.ProductConstraints;
import com.example.ecommerce.common.response.ApiEnvelope;
import com.example.ecommerce.common.response.ApiEnvelopeFactory;
import com.example.ecommerce.common.response.ApiErrorCode;
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

    private ResponseEntity<ApiEnvelope<Void>> buildClassifiedResponse(String message, WebRequest request) {
        ErrorClassification classification = classifyMessage(message);
        return buildErrorResponse(
                classification.status(),
                classification.resolveMessage(message),
                classification.code(),
                baseDetails(request)
        );
    }

    @ExceptionHandler(SellerException.class)
    public ResponseEntity<ApiEnvelope<Void>> sellerExceptionHandler(SellerException ex, WebRequest request) {
        return buildClassifiedResponse(ex.getMessage(), request);
    }

    @ExceptionHandler(ProductException.class)
    public ResponseEntity<ApiEnvelope<Void>> productExceptionHandler(ProductException ex, WebRequest request) {
        return buildClassifiedResponse(ex.getMessage(), request);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiEnvelope<Void>> userNotFoundExceptionHandler(UserNotFoundException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                ApiErrorCode.RESOURCE_NOT_FOUND,
                request
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
                    request
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
                    request
            );
        }

        return buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Request violates database constraints.",
                ApiErrorCode.VALIDATION_ERROR,
                request
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiEnvelope<Void>> illegalArgumentExceptionHandler(
            IllegalArgumentException ex,
            WebRequest request
    ) {
        return buildClassifiedResponse(ex.getMessage(), request);
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
                    request
            );
        }

        return buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                ApiErrorCode.AUTH_REQUIRED,
                request
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
        return buildClassifiedResponse(ex.getMessage(), request);
    }

    private ErrorClassification classifyMessage(String message) {
        String safeMessage = message == null ? "" : message.trim();
        String normalized = safeMessage.toLowerCase();

        if (normalized.contains("no seller account found")
                || normalized.contains("no customer account found")
                || normalized.contains("seller not found")
                || normalized.contains("user not found")
                || normalized.contains("user not exist")
                || normalized.contains("resource not found")) {
            return new ErrorClassification(
                    HttpStatus.NOT_FOUND,
                    ApiErrorCode.RESOURCE_NOT_FOUND,
                    "Resource not found"
            );
        }

        if (normalized.contains("already registered")
                || normalized.contains("already exist")
                || normalized.contains("already exists")
                || normalized.contains("request already exists")
                || normalized.contains("duplicate")
                || normalized.contains("email already in use")
                || normalized.contains("unique")) {
            return new ErrorClassification(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.DUPLICATE_RESOURCE,
                    "Resource already exists"
            );
        }

        if (normalized.contains("maximum otp attempts")
                || normalized.contains("too many otp")
                || normalized.contains("too many requests")) {
            return new ErrorClassification(
                    HttpStatus.TOO_MANY_REQUESTS,
                    ApiErrorCode.RATE_LIMIT_EXCEEDED,
                    "Too many requests"
            );
        }

        if (normalized.contains("invalid otp")
                || normalized.contains("wrong otp")
                || normalized.contains("otp expired")
                || normalized.contains("otp already used")
                || normalized.contains("bad credentials")
                || normalized.contains("invalid credentials")) {
            return new ErrorClassification(
                    HttpStatus.UNAUTHORIZED,
                    ApiErrorCode.INVALID_CREDENTIALS,
                    "Invalid credentials"
            );
        }

        if (normalized.contains("otp")
                || normalized.contains("validation")
                || normalized.contains("invalid")
                || normalized.contains("insufficient warehouse stock")
                || normalized.contains("insufficient seller stock")
                || normalized.contains("transfer quantity")
                || normalized.contains("must complete price difference payment")
                || normalized.contains("must")
                || normalized.contains("required")
                || normalized.contains("unsupported payment method")
                || normalized.contains("use seller email verification flow")
                || normalized.contains("please register first")
                || normalized.contains("please sign up first")
                || normalized.contains("new email must be different")
                || normalized.contains("request violates database constraints")
                || normalized.contains("data too long")) {
            return new ErrorClassification(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    ApiErrorCode.VALIDATION_ERROR,
                    "Validation failed"
            );
        }

        if (normalized.contains("service unavailable")
                || normalized.contains("payment gateway")
                || normalized.contains("phonepe is not configured")
                || normalized.contains("phonepe_base_url")
                || normalized.contains("phonepe_merchant_id")
                || normalized.contains("phonepe_salt_key")
                || normalized.contains("phonepe_salt_index")
                || normalized.contains("stripe is not configured")
                || normalized.contains("stripe_secret_key")
                || normalized.contains("razorpay is not configured")
                || normalized.contains("razorpay_api_key")
                || normalized.contains("razorpay_api_secret")) {
            return new ErrorClassification(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    ApiErrorCode.SERVICE_UNAVAILABLE,
                    "Service unavailable"
            );
        }

        return new ErrorClassification(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ApiErrorCode.INTERNAL_ERROR,
                "Internal server error"
        );
    }

    private record ErrorClassification(HttpStatus status, ApiErrorCode code, String fallbackMessage) {
        private String resolveMessage(String message) {
            if (code == ApiErrorCode.INTERNAL_ERROR) {
                return fallbackMessage;
            }
            return message == null || message.isBlank() ? fallbackMessage : message;
        }
    }
}
