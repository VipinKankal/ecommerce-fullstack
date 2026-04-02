package com.example.ecommerce.seller.service.impl;

import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.seller.service.GstinVerificationService;

final class SellerGstProfileSupport {
    static final String POLICY_MANDATORY_ACTIVE_GSTIN = "MANDATORY_ACTIVE_GSTIN";
    static final String POLICY_ALLOW_NON_GST = "ALLOW_NON_GST_WITH_DECLARATION";
    static final String GST_REGISTERED = "GST_REGISTERED";
    static final String NON_GST_DECLARATION = "NON_GST_DECLARATION";
    static final String GST_COMPLIANCE_ACTIVE = "ACTIVE_GSTIN";
    static final String GST_COMPLIANCE_PENDING_ADMIN = "PENDING_ADMIN_VERIFICATION";
    static final String GST_COMPLIANCE_DECLARED_NON_GST = "DECLARED_NON_GST";

    private SellerGstProfileSupport() {
    }

    static void applySellerGstProfile(
            Seller seller,
            String requestedRegistrationType,
            String requestedGstin,
            Boolean declarationAccepted,
            String gstOnboardingPolicy,
            boolean enforceActiveGstinOnSignup,
            GstinVerificationService gstinVerificationService
    ) {
        String normalizedPolicy = normalizeOnboardingPolicy(gstOnboardingPolicy);
        String normalizedRegistrationType = resolveRegistrationType(
                requestedRegistrationType,
                requestedGstin,
                declarationAccepted
        );

        seller.setGstOnboardingPolicy(normalizedPolicy);
        seller.setGstRegistrationType(normalizedRegistrationType);

        if (GST_REGISTERED.equals(normalizedRegistrationType)) {
            String normalizedGstin = gstinVerificationService.normalizeAndValidate(requestedGstin);
            seller.setGSTIN(normalizedGstin);
            seller.setGstDeclarationAccepted(false);
            if (enforceActiveGstinOnSignup) {
                gstinVerificationService.assertActive(normalizedGstin);
                seller.setGstComplianceStatus(GST_COMPLIANCE_ACTIVE);
            } else {
                seller.setGstComplianceStatus(GST_COMPLIANCE_PENDING_ADMIN);
            }
            if (seller.getBusinessDetails() != null) {
                seller.getBusinessDetails().setGstNumber(normalizedGstin);
            }
            return;
        }

        if (!POLICY_ALLOW_NON_GST.equals(normalizedPolicy)) {
            throw new IllegalArgumentException("Current onboarding policy requires an active GSTIN");
        }
        if (!Boolean.TRUE.equals(declarationAccepted)) {
            throw new IllegalArgumentException("Non-GST onboarding requires an accepted declaration");
        }

        seller.setGSTIN(null);
        seller.setGstDeclarationAccepted(true);
        seller.setGstComplianceStatus(GST_COMPLIANCE_DECLARED_NON_GST);
        if (seller.getBusinessDetails() != null) {
            seller.getBusinessDetails().setGstNumber(null);
        }
    }

    private static String resolveRegistrationType(
            String requestedRegistrationType,
            String requestedGstin,
            Boolean declarationAccepted
    ) {
        String normalizedRequestedType = normalizeNullable(requestedRegistrationType);
        if (normalizedRequestedType != null) {
            if (GST_REGISTERED.equals(normalizedRequestedType) || NON_GST_DECLARATION.equals(normalizedRequestedType)) {
                return normalizedRequestedType;
            }
            throw new IllegalArgumentException("Unsupported seller GST registration type");
        }
        if (requestedGstin != null && !requestedGstin.isBlank()) {
            return GST_REGISTERED;
        }
        return Boolean.TRUE.equals(declarationAccepted) ? NON_GST_DECLARATION : GST_REGISTERED;
    }

    private static String normalizeOnboardingPolicy(String policy) {
        String normalized = normalizeNullable(policy);
        if (normalized == null || POLICY_MANDATORY_ACTIVE_GSTIN.equals(normalized)) {
            return POLICY_MANDATORY_ACTIVE_GSTIN;
        }
        if (POLICY_ALLOW_NON_GST.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported GST onboarding policy");
    }

    private static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }
}
