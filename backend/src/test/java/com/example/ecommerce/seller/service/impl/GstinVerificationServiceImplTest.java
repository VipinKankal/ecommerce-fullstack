package com.example.ecommerce.seller.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GstinVerificationServiceImplTest {

    private static final String VALID_GSTIN = "29ABCDE1234F1ZW";

    private GstinVerificationServiceImpl serviceWithManualList(String allowList) {
        GstinVerificationServiceImpl service = new GstinVerificationServiceImpl(new RestTemplate());
        ReflectionTestUtils.setField(service, "verificationMode", "MANUAL");
        ReflectionTestUtils.setField(service, "manuallyApprovedActiveGstins", allowList);
        ReflectionTestUtils.setField(service, "gstVerificationApiUrl", "");
        ReflectionTestUtils.setField(service, "gstVerificationApiKey", "");
        return service;
    }

    @Test
    void normalizeAndValidateAcceptsValidGstin() {
        GstinVerificationServiceImpl service = serviceWithManualList(VALID_GSTIN);
        assertEquals(VALID_GSTIN, service.normalizeAndValidate("29abcde1234f1zw"));
    }

    @Test
    void normalizeAndValidateRejectsInvalidFormat() {
        GstinVerificationServiceImpl service = serviceWithManualList(VALID_GSTIN);
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.normalizeAndValidate("INVALID")
        );
        assertEquals("Invalid GSTIN format", ex.getMessage());
    }

    @Test
    void normalizeAndValidateRejectsInvalidChecksum() {
        GstinVerificationServiceImpl service = serviceWithManualList(VALID_GSTIN);
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.normalizeAndValidate("29ABCDE1234F1ZX")
        );
        assertEquals("Invalid GSTIN checksum", ex.getMessage());
    }

    @Test
    void assertActiveAllowsManuallyApprovedGstin() {
        GstinVerificationServiceImpl service = serviceWithManualList(VALID_GSTIN);
        assertDoesNotThrow(() -> service.assertActive(VALID_GSTIN));
    }

    @Test
    void assertActiveRejectsUnapprovedGstin() {
        GstinVerificationServiceImpl service = serviceWithManualList(VALID_GSTIN);
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.assertActive("27ABCDE1234F1Z0")
        );
        assertEquals(
                "GSTIN is not ACTIVE. Seller onboarding allows only ACTIVE GST registration.",
                ex.getMessage()
        );
    }
}
