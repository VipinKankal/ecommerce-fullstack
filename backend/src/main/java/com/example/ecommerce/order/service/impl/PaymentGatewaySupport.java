package com.example.ecommerce.order.service.impl;

final class PaymentGatewaySupport {

    private PaymentGatewaySupport() {
    }

    static boolean isRazorpayConfigured(String apiKey, String apiSecret) {
        return isMeaningfulSecret(apiKey) && isMeaningfulSecret(apiSecret)
                && !"api_key".equalsIgnoreCase(apiKey)
                && !"api_secret".equalsIgnoreCase(apiSecret);
    }

    static boolean isPhonePeConfigured(
            String phonePeBaseUrl,
            String phonePeMerchantId,
            String phonePeSaltKey,
            String phonePeSaltIndex
    ) {
        return isMeaningfulSecret(phonePeBaseUrl)
                && isMeaningfulSecret(phonePeMerchantId)
                && isMeaningfulSecret(phonePeSaltKey)
                && isMeaningfulSecret(phonePeSaltIndex);
    }

    static boolean isStripeConfigured(String stripeSecretKey) {
        return isMeaningfulSecret(stripeSecretKey)
                && !"stripe_secret_key".equalsIgnoreCase(stripeSecretKey);
    }

    static boolean isMeaningfulSecret(String value) {
        return value != null && !value.trim().isEmpty();
    }

    static String maskPrefix(String value) {
        if (!isMeaningfulSecret(value)) {
            return "MISSING";
        }
        String trimmed = value.trim();
        return trimmed.length() <= 8 ? trimmed : trimmed.substring(0, 8) + "...";
    }

    static String maskSuffix(String value) {
        if (!isMeaningfulSecret(value)) {
            return "MISSING";
        }
        String trimmed = value.trim();
        return trimmed.length() <= 4 ? "****" : "****" + trimmed.substring(trimmed.length() - 4);
    }

    static String buildUrl(String baseUrl, String defaultBaseUrl, String path) {
        String resolvedBaseUrl = baseUrl == null ? defaultBaseUrl : baseUrl.trim();
        if (resolvedBaseUrl.endsWith("/")) {
            resolvedBaseUrl = resolvedBaseUrl.substring(0, resolvedBaseUrl.length() - 1);
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return resolvedBaseUrl + path;
    }

    static String normalizeUrl(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    static String firstNonBlank(String... values) {
        for (String value : values) {
            if (isMeaningfulSecret(value)) {
                return value;
            }
        }
        return null;
    }
}
