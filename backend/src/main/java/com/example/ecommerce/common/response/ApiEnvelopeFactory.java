package com.example.ecommerce.common.response;

import org.springframework.beans.BeanWrapperImpl;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public final class ApiEnvelopeFactory {

    private ApiEnvelopeFactory() {
    }

    public static <T> ApiEnvelope<T> success(HttpStatus status, String message, T data) {
        return new ApiEnvelope<>(
                true,
                status.value(),
                normalizeMessage(message, defaultSuccessMessage(status)),
                data,
                null,
                Instant.now().toString()
        );
    }

    public static ApiEnvelope<Void> error(HttpStatus status, String message, ApiErrorCode code, Object details) {
        return new ApiEnvelope<>(
                false,
                status.value(),
                normalizeMessage(message, defaultErrorMessage(status)),
                null,
                new ApiErrorPayload(code, normalizeDetails(details)),
                Instant.now().toString()
        );
    }

    public static String resolveSuccessMessage(Object body, HttpStatus status) {
        String candidate = resolveMessage(body);
        return normalizeMessage(candidate, defaultSuccessMessage(status));
    }

    public static String resolveErrorMessage(Object body, HttpStatus status) {
        String candidate = resolveMessage(body);
        return normalizeMessage(candidate, defaultErrorMessage(status));
    }

    public static ApiErrorCode resolveErrorCode(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> ApiErrorCode.AUTH_REQUIRED;
            case FORBIDDEN -> ApiErrorCode.ACCESS_DENIED;
            case NOT_FOUND -> ApiErrorCode.RESOURCE_NOT_FOUND;
            case UNPROCESSABLE_ENTITY -> ApiErrorCode.VALIDATION_ERROR;
            case CONFLICT -> ApiErrorCode.DUPLICATE_RESOURCE;
            case TOO_MANY_REQUESTS -> ApiErrorCode.RATE_LIMIT_EXCEEDED;
            case SERVICE_UNAVAILABLE -> ApiErrorCode.SERVICE_UNAVAILABLE;
            default -> ApiErrorCode.INTERNAL_ERROR;
        };
    }

    public static Map<String, Object> buildPathDetails(String path) {
        LinkedHashMap<String, Object> details = new LinkedHashMap<>();
        details.put("path", path);
        return details;
    }

    public static Object resolveErrorDetails(Object body, String path) {
        LinkedHashMap<String, Object> details = new LinkedHashMap<>();
        details.put("path", path);

        if (body instanceof Map<?, ?> map) {
            LinkedHashMap<String, Object> extra = new LinkedHashMap<>();
            map.forEach((key, value) -> {
                if (key instanceof String keyString && !"message".equals(keyString)) {
                    extra.put(keyString, value);
                }
            });
            if (!extra.isEmpty()) {
                details.put("meta", extra);
            }
        }

        return details;
    }

    private static Object normalizeDetails(Object details) {
        if (details instanceof Map<?, ?> map && map.isEmpty()) {
            return null;
        }
        return details;
    }

    private static String resolveMessage(Object body) {
        if (body == null) {
            return null;
        }

        if (body instanceof Map<?, ?> map) {
            Object message = map.get("message");
            if (message instanceof String messageValue && StringUtils.hasText(messageValue)) {
                return messageValue;
            }
        }

        try {
            BeanWrapperImpl beanWrapper = new BeanWrapperImpl(body);
            if (beanWrapper.isReadableProperty("message")) {
                Object message = beanWrapper.getPropertyValue("message");
                if (message instanceof String messageValue && StringUtils.hasText(messageValue)) {
                    return messageValue;
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    private static String normalizeMessage(String message, String fallback) {
        return StringUtils.hasText(message) ? message : fallback;
    }

    private static String defaultSuccessMessage(HttpStatus status) {
        return switch (status) {
            case CREATED -> "Created";
            case ACCEPTED -> "Accepted";
            case NO_CONTENT -> "No content";
            default -> "Success";
        };
    }

    private static String defaultErrorMessage(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> "Authentication required";
            case FORBIDDEN -> "Access denied";
            case NOT_FOUND -> "Resource not found";
            case UNPROCESSABLE_ENTITY -> "Validation failed";
            case CONFLICT -> "Resource already exists";
            case TOO_MANY_REQUESTS -> "Too many requests";
            case SERVICE_UNAVAILABLE -> "Service unavailable";
            default -> "Internal server error";
        };
    }
}
