package com.example.ecommerce.seller.service.impl;

import com.example.ecommerce.seller.service.GstinVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GstinVerificationServiceImpl implements GstinVerificationService {

    private static final String GSTIN_REGEX = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$";
    private static final String CHECKSUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    private final RestTemplate restTemplate;

    @Value("${app.gst.verification.mode:MANUAL}")
    private String verificationMode;

    @Value("${app.gst.verification.manual-active-gstins:}")
    private String manuallyApprovedActiveGstins;

    @Value("${app.gst.verification.api-url:}")
    private String gstVerificationApiUrl;

    @Value("${app.gst.verification.api-key:}")
    private String gstVerificationApiKey;

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
        boolean isActive = switch (verificationMode.trim().toUpperCase()) {
            case "API" -> verifyUsingApi(normalized);
            case "API_THEN_MANUAL" -> verifyUsingApiOrManual(normalized);
            case "MANUAL" -> verifyUsingManualList(normalized);
            default -> throw new IllegalArgumentException(
                    "Unsupported GST verification mode. Use MANUAL, API, or API_THEN_MANUAL."
            );
        };

        if (!isActive) {
            throw new IllegalArgumentException(
                    "GSTIN is not ACTIVE. Seller onboarding allows only ACTIVE GST registration."
            );
        }
    }

    private boolean verifyUsingApiOrManual(String normalizedGstin) {
        try {
            return verifyUsingApi(normalizedGstin);
        } catch (IllegalArgumentException ex) {
            return verifyUsingManualList(normalizedGstin);
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

    private boolean verifyUsingApi(String normalizedGstin) {
        if (gstVerificationApiUrl == null || gstVerificationApiUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "GST verification API URL is not configured."
            );
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            if (gstVerificationApiKey != null && !gstVerificationApiKey.isBlank()) {
                headers.set("X-API-KEY", gstVerificationApiKey.trim());
            }

            String url = UriComponentsBuilder
                    .fromUriString(gstVerificationApiUrl.trim())
                    .queryParam("gstin", normalizedGstin)
                    .toUriString();

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            Map<?, ?> body = response.getBody();
            if (body == null) {
                throw new IllegalArgumentException("GST verification API returned empty response.");
            }

            String status = resolveStatus(body);
            return "ACTIVE".equals(status);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unable to verify GSTIN via API.");
        }
    }

    private String resolveStatus(Map<?, ?> body) {
        Object rawStatus = firstPresent(
                body.get("status"),
                body.get("gstinStatus"),
                body.get("registrationStatus"),
                body.get("gst_status"),
                body.get("state")
        );
        if (rawStatus == null) {
            return "";
        }
        return String.valueOf(rawStatus).trim().toUpperCase();
    }

    private Object firstPresent(Object... values) {
        for (Object value : values) {
            if (value != null && !String.valueOf(value).isBlank()) {
                return value;
            }
        }
        return null;
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
