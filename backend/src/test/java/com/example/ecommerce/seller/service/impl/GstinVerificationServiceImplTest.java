package com.example.ecommerce.seller.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GstinVerificationServiceImplTest {

    private static final String VALID_GSTIN = "29ABCDE1234F1ZW";

    private GstinVerificationServiceImpl serviceWithManualList(String allowList) {
        GstinVerificationServiceImpl service = new GstinVerificationServiceImpl();
        ReflectionTestUtils.setField(service, "verificationMode", "MANUAL");
        ReflectionTestUtils.setField(service, "manuallyApprovedActiveGstins", allowList);
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

    @Test
    void assertActiveRejectsApiModeBecauseApiVerificationIsDisabled() {
        GstinVerificationServiceImpl service = serviceWithManualList(VALID_GSTIN);
        ReflectionTestUtils.setField(service, "verificationMode", "API");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.assertActive(VALID_GSTIN)
        );
        assertEquals(
                "GST verification API mode is disabled. Use MANUAL verification and admin review.",
                ex.getMessage()
        );
    }
}
