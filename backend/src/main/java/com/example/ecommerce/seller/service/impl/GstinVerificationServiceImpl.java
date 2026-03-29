package com.example.ecommerce.seller.service.impl;

import com.example.ecommerce.seller.service.GstinVerificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GstinVerificationServiceImpl implements GstinVerificationService {

    private static final String GSTIN_REGEX = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$";
    private static final String CHECKSUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    @Value("${app.gst.verification.mode:MANUAL}")
    private String verificationMode;

    @Value("${app.gst.verification.manual-active-gstins:}")
    private String manuallyApprovedActiveGstins;

    @Override
    public String normalizeAndValidate(String gstin) {
        String normalized = gstin == null ? "" : gstin.trim().toUpperCase();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("GSTIN is required");
        }
        if (!normalized.matches(GSTIN_REGEX)) {
            throw new IllegalArgumentException("Invalid GSTIN format");
        }
        if (!isValidChecksum(normalized)) {
            throw new IllegalArgumentException("Invalid GSTIN checksum");
        }
        return normalized;
    }

    @Override
    public void assertActive(String gstin) {
        String normalized = normalizeAndValidate(gstin);
        String normalizedMode = verificationMode == null
                ? "MANUAL"
                : verificationMode.trim().toUpperCase();
        if (!"MANUAL".equals(normalizedMode)) {
            throw new IllegalArgumentException(
                    "GST verification API mode is disabled. Use MANUAL verification and admin review."
            );
        }

        boolean isActive = verifyUsingManualList(normalized);

        if (!isActive) {
            throw new IllegalArgumentException(
                    "GSTIN is not ACTIVE. Seller onboarding allows only ACTIVE GST registration."
            );
        }
    }

    private boolean verifyUsingManualList(String normalizedGstin) {
        Set<String> allowList = parseAllowList();
        if (allowList.isEmpty()) {
            throw new IllegalArgumentException(
                    "Manual GST verification list is empty. Configure app.gst.verification.manual-active-gstins."
            );
        }
        return allowList.contains(normalizedGstin);
    }

    private Set<String> parseAllowList() {
        if (manuallyApprovedActiveGstins == null || manuallyApprovedActiveGstins.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(manuallyApprovedActiveGstins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
    }

    private boolean isValidChecksum(String gstin) {
        int factor = 2;
        int sum = 0;

        for (int i = gstin.length() - 2; i >= 0; i--) {
            int codePoint = CHECKSUM_CHARS.indexOf(gstin.charAt(i));
            if (codePoint < 0) {
                return false;
            }
            int addend = factor * codePoint;
            factor = factor == 2 ? 1 : 2;
            addend = (addend / 36) + (addend % 36);
            sum += addend;
        }

        int remainder = sum % 36;
        int checkCodePoint = (36 - remainder) % 36;
        char expectedCheckChar = CHECKSUM_CHARS.charAt(checkCodePoint);
        return gstin.charAt(gstin.length() - 1) == expectedCheckChar;
    }
}
