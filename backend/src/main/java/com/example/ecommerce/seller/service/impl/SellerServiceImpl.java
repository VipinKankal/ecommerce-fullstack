package com.example.ecommerce.seller.service.impl;

import com.example.ecommerce.common.configuration.AuthenticatedPrincipalService;
import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.exceptions.SellerException;
import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.BankDetails;
import com.example.ecommerce.modal.BusinessDetails;
import com.example.ecommerce.modal.KycDetails;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.StoreDetails;
import com.example.ecommerce.modal.VerificationCode;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.VerificationCodeRepository;
import com.example.ecommerce.seller.request.SellerSignupRequest;
import com.example.ecommerce.seller.request.SellerUpdateRequest;
import com.example.ecommerce.seller.service.GstinVerificationService;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerServiceImpl implements SellerService {
    private static final String SELLER_ALREADY_REGISTERED_MESSAGE =
            "This email is already registered as a seller. Please log in instead.";
    private static final String POLICY_MANDATORY_ACTIVE_GSTIN = "MANDATORY_ACTIVE_GSTIN";
    private static final String POLICY_ALLOW_NON_GST = "ALLOW_NON_GST_WITH_DECLARATION";
    private static final String GST_REGISTERED = "GST_REGISTERED";
    private static final String NON_GST_DECLARATION = "NON_GST_DECLARATION";
    private static final String GST_COMPLIANCE_ACTIVE = "ACTIVE_GSTIN";
    private static final String GST_COMPLIANCE_PENDING_ADMIN = "PENDING_ADMIN_VERIFICATION";
    private static final String GST_COMPLIANCE_DECLARED_NON_GST = "DECLARED_NON_GST";

    private final SellerRepository sellerRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeRepository verificationCodeRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AuthenticatedPrincipalService authenticatedPrincipalService;
    private final GstinVerificationService gstinVerificationService;

    @Value("${app.gst.onboarding.policy:MANDATORY_ACTIVE_GSTIN}")
    private String gstOnboardingPolicy;

    @Value("${app.gst.verification.enforce-active-on-signup:false}")
    private boolean enforceActiveGstinOnSignup;

    @Override
    public Seller getSellerProfile(String jwt) throws Exception {
        String email = (jwt != null && !jwt.isBlank())
                ? jwtProvider.getEmailFromToken(jwt)
                : authenticatedPrincipalService.currentEmail();
        return this.getSellerByEmail(email);
    }

    @Override
    public Seller createSeller(SellerSignupRequest request) throws Exception {
        repairSellerSchemaIfNeeded();

        String normalizedEmail = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        Seller sellerExist = sellerRepository.findByEmail(normalizedEmail);
        if (sellerExist != null) {
            throw new IllegalArgumentException(SELLER_ALREADY_REGISTERED_MESSAGE);
        }

        Seller newSeller = new Seller();
        newSeller.setEmail(normalizedEmail);
        newSeller.setPassword(passwordEncoder.encode(request.getPassword()));
        newSeller.setSellerName(request.getSellerName());
        newSeller.setPickupAddress(request.getPickupAddress() == null ? new Address() : request.getPickupAddress());
        newSeller.setRole(UserRole.ROLE_SELLER);
        newSeller.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
        newSeller.setMobileNumber(request.getMobileNumber());
        newSeller.setDateOfBirth(request.getDateOfBirth());
        newSeller.setBankDetails(request.getBankDetails() == null ? new BankDetails() : request.getBankDetails());

        BusinessDetails businessDetails = request.getBusinessDetails() == null ? new BusinessDetails() : request.getBusinessDetails();
        newSeller.setBusinessDetails(businessDetails);
        newSeller.setKycDetails(request.getKycDetails() == null ? new KycDetails() : request.getKycDetails());
        newSeller.setStoreDetails(request.getStoreDetails() == null ? new StoreDetails() : request.getStoreDetails());
        applySellerGstProfile(
                newSeller,
                request.getGstRegistrationType(),
                request.getGSTIN(),
                request.getGstDeclarationAccepted()
        );

        return sellerRepository.save(newSeller);
    }

    private void repairSellerSchemaIfNeeded() {
        try {
            String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            if (schema == null || schema.isBlank()) {
                return;
            }

            List<String> constraints = jdbcTemplate.queryForList("""
                    SELECT constraint_name
                    FROM information_schema.table_constraints
                    WHERE constraint_schema = ?
                      AND table_name = 'seller'
                      AND constraint_type = 'CHECK'
                    """, String.class, schema);

            for (String constraint : constraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE seller DROP CHECK `" + constraint + "`");
                } catch (Exception ignored) {
                    try {
                        jdbcTemplate.execute("ALTER TABLE seller DROP CONSTRAINT `" + constraint + "`");
                    } catch (Exception ignoredToo) {
                    }
                }
            }

            jdbcTemplate.execute("ALTER TABLE seller MODIFY COLUMN role VARCHAR(32) NOT NULL");
            jdbcTemplate.execute("ALTER TABLE seller MODIFY COLUMN account_status VARCHAR(64) NULL");
            jdbcTemplate.execute("ALTER TABLE seller MODIFY COLUMN business_type VARCHAR(64) NULL");

            jdbcTemplate.execute("""
                    UPDATE seller
                    SET role = CASE role
                        WHEN 'ADMIN' THEN 'ROLE_ADMIN'
                        WHEN 'CUSTOMER' THEN 'ROLE_CUSTOMER'
                        WHEN 'SELLER' THEN 'ROLE_SELLER'
                        ELSE role
                    END
                    """);

            jdbcTemplate.execute("""
                    UPDATE seller
                    SET account_status = CASE account_status
                        WHEN 'VERIFIED' THEN 'ACTIVE'
                        WHEN 'INACTIVE' THEN 'DEACTIVATED'
                        WHEN 'DISABLED' THEN 'SUSPENDED'
                        ELSE account_status
                    END
                    """);
        } catch (Exception ignored) {
        }
    }

    @Override
    public Seller getSellerById(Long id) throws SellerException {
        return sellerRepository.findById(id)
                .orElseThrow(() -> SellerException.notFound(id));
    }

    @Override
    public Seller getSellerByEmail(String email) throws Exception {
        Seller seller = sellerRepository.findByEmail(email);
        if (seller == null) {
            throw new Exception("seller not found...");
        }
        return seller;
    }

    @Override
    public List<Seller> getAllSellers(AccountStatus status) {
        if (status == null) {
            return sellerRepository.findAll();
        }
        return sellerRepository.findByAccountStatus(status);
    }

    @Override
    public Seller updateSeller(Long id, SellerUpdateRequest request) throws Exception {
        Seller existingSeller = this.getSellerById(id);

        if (request.getSellerName() != null) {
            existingSeller.setSellerName(request.getSellerName());
        }
        if (request.getMobileNumber() != null) {
            existingSeller.setMobileNumber(request.getMobileNumber());
        }
        if (request.getEmail() != null
                && !request.getEmail().trim().equalsIgnoreCase(existingSeller.getEmail())) {
            throw new IllegalArgumentException(
                    "Use seller email verification flow to update the primary login email."
            );
        }
        if (request.getDateOfBirth() != null) {
            existingSeller.setDateOfBirth(request.getDateOfBirth());
        }

        if (existingSeller.getBusinessDetails() == null) {
            existingSeller.setBusinessDetails(new BusinessDetails());
        }
        if (existingSeller.getBankDetails() == null) {
            existingSeller.setBankDetails(new BankDetails());
        }
        if (existingSeller.getKycDetails() == null) {
            existingSeller.setKycDetails(new KycDetails());
        }
        if (existingSeller.getStoreDetails() == null) {
            existingSeller.setStoreDetails(new StoreDetails());
        }
        if (existingSeller.getPickupAddress() == null) {
            existingSeller.setPickupAddress(new Address());
        }

        String requestedGstin = request.getGSTIN();
        if (request.getBusinessDetails() != null
                && request.getBusinessDetails().getGstNumber() != null
                && !request.getBusinessDetails().getGstNumber().isBlank()) {
            requestedGstin = request.getBusinessDetails().getGstNumber();
        }
        boolean shouldUpdateGstProfile = request.getGstRegistrationType() != null
                || request.getGstDeclarationAccepted() != null
                || requestedGstin != null;
        if (shouldUpdateGstProfile) {
            applySellerGstProfile(
                    existingSeller,
                    request.getGstRegistrationType(),
                    requestedGstin,
                    request.getGstDeclarationAccepted()
            );
        }

        if (request.getBusinessDetails() != null) {
            BusinessDetails current = existingSeller.getBusinessDetails();
            BusinessDetails incoming = request.getBusinessDetails();
            if (incoming.getBusinessName() != null) current.setBusinessName(incoming.getBusinessName());
            if (incoming.getBusinessType() != null) current.setBusinessType(incoming.getBusinessType());
            current.setGstNumber(existingSeller.getGSTIN());
            if (incoming.getPanNumber() != null) current.setPanNumber(incoming.getPanNumber());
        }

        if (request.getBankDetails() != null) {
            BankDetails current = existingSeller.getBankDetails();
            BankDetails incoming = request.getBankDetails();
            if (incoming.getAccountHolderName() != null) current.setAccountHolderName(incoming.getAccountHolderName());
            if (incoming.getBankName() != null) current.setBankName(incoming.getBankName());
            if (incoming.getAccountNumber() != null) current.setAccountNumber(incoming.getAccountNumber());
            if (incoming.getIfscCode() != null) current.setIfscCode(incoming.getIfscCode());
        }

        if (request.getPickupAddress() != null) {
            Address current = existingSeller.getPickupAddress();
            Address incoming = request.getPickupAddress();
            if (incoming.getName() != null) current.setName(incoming.getName());
            if (incoming.getStreet() != null) current.setStreet(incoming.getStreet());
            if (incoming.getLocality() != null) current.setLocality(incoming.getLocality());
            if (incoming.getAddress() != null) current.setAddress(incoming.getAddress());
            if (incoming.getCity() != null) current.setCity(incoming.getCity());
            if (incoming.getState() != null) current.setState(incoming.getState());
            if (incoming.getPinCode() != null) current.setPinCode(incoming.getPinCode());
            if (incoming.getMobileNumber() != null) current.setMobileNumber(incoming.getMobileNumber());
            if (incoming.getCountry() != null) current.setCountry(incoming.getCountry());
        }

        if (request.getKycDetails() != null) {
            KycDetails current = existingSeller.getKycDetails();
            KycDetails incoming = request.getKycDetails();
            if (incoming.getPanCardUrl() != null) current.setPanCardUrl(incoming.getPanCardUrl());
            if (incoming.getAadhaarCardUrl() != null) current.setAadhaarCardUrl(incoming.getAadhaarCardUrl());
            if (incoming.getGstCertificateUrl() != null) current.setGstCertificateUrl(incoming.getGstCertificateUrl());
        }

        if (request.getStoreDetails() != null) {
            StoreDetails current = existingSeller.getStoreDetails();
            StoreDetails incoming = request.getStoreDetails();
            if (incoming.getStoreName() != null) current.setStoreName(incoming.getStoreName());
            if (incoming.getStoreLogo() != null) current.setStoreLogo(incoming.getStoreLogo());
            if (incoming.getStoreDescription() != null) current.setStoreDescription(incoming.getStoreDescription());
            if (incoming.getPrimaryCategory() != null) current.setPrimaryCategory(incoming.getPrimaryCategory());
            if (incoming.getSupportEmail() != null) current.setSupportEmail(incoming.getSupportEmail());
            if (incoming.getSupportPhone() != null) current.setSupportPhone(incoming.getSupportPhone());
        }

        return sellerRepository.save(existingSeller);
    }

    private void applySellerGstProfile(
            Seller seller,
            String requestedRegistrationType,
            String requestedGstin,
            Boolean declarationAccepted
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

    private String resolveRegistrationType(
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

    private String normalizeOnboardingPolicy(String policy) {
        String normalized = normalizeNullable(policy);
        if (normalized == null || POLICY_MANDATORY_ACTIVE_GSTIN.equals(normalized)) {
            return POLICY_MANDATORY_ACTIVE_GSTIN;
        }
        if (POLICY_ALLOW_NON_GST.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported GST onboarding policy");
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    @Override
    public void deleteSeller(Long id) throws Exception {
        Seller seller = getSellerById(id);
        sellerRepository.delete(seller);
    }

    @Override
    public Seller verifyEmail(String email, String otp) throws Exception {
        VerificationCode verificationCode = verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (verificationCode == null || Boolean.TRUE.equals(verificationCode.getConsumed())) {
            throw new Exception("Invalid OTP");
        }
        if (verificationCode.getExpiresAt() == null || LocalDateTime.now().isAfter(verificationCode.getExpiresAt())) {
            throw new Exception("OTP expired");
        }
        if (!verificationCode.getOtp().equals(otp)) {
            throw new Exception("Invalid OTP");
        }

        Seller seller = getSellerByEmail(email);
        seller.setEmailVerified(true);
        verificationCodeRepository.delete(verificationCode);
        return sellerRepository.save(seller);
    }

    @Override
    public Seller updateSellerAccountStatus(Long sellerId, AccountStatus status) throws Exception {
        Seller seller = getSellerById(sellerId);
        seller.setAccountStatus(status);
        return sellerRepository.save(seller);
    }
}
