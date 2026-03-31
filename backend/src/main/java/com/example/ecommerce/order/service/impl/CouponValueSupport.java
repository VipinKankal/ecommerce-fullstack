package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.order.exception.CouponOperationException;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

final class CouponValueSupport {

    private CouponValueSupport() {
    }

    static String normalizeCode(
            String code,
            BiFunction<String, String, CouponOperationException> validationErrorFactory
    ) {
        if (code == null || code.isBlank()) {
            throw validationErrorFactory.apply("COUPON_CODE_REQUIRED", "Coupon code is required");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    static double roundCurrency(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    static String formatContext(String clientIp, String deviceId) {
        String normalizedIp = clientIp == null ? "" : clientIp.trim();
        String normalizedDevice = deviceId == null ? "" : deviceId.trim();
        if (normalizedIp.isEmpty() && normalizedDevice.isEmpty()) {
            return "";
        }
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        if (!normalizedIp.isEmpty()) {
            context.put("ip", normalizedIp);
        }
        if (!normalizedDevice.isEmpty()) {
            context.put("device", normalizedDevice);
        }
        return " context=" + context;
    }

    static Set<Long> sanitizeUserIds(List<Long> userIds) {
        if (userIds == null) {
            return Set.of();
        }
        return userIds.stream()
                .filter(value -> value != null && value > 0)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
