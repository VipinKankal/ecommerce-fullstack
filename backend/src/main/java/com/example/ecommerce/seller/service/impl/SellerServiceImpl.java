package com.example.ecommerce.seller.service.impl;

import com.example.ecommerce.common.configuration.AuthenticatedPrincipalService;
import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.exceptions.SellerException;
import com.example.ecommerce.modal.Seller;
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

        String normalizedEmail = SellerProfileSupport.normalizeEmail(request.getEmail());
        Seller sellerExist = sellerRepository.findByEmail(normalizedEmail);
        if (sellerExist != null) {
            throw new IllegalArgumentException(SELLER_ALREADY_REGISTERED_MESSAGE);
        }

        Seller newSeller = SellerProfileSupport.buildNewSeller(
                request,
                normalizedEmail,
                passwordEncoder.encode(request.getPassword())
        );
        SellerGstProfileSupport.applySellerGstProfile(
                newSeller,
                request.getGstRegistrationType(),
                request.getGSTIN(),
                request.getGstDeclarationAccepted(),
                gstOnboardingPolicy,
                enforceActiveGstinOnSignup,
                gstinVerificationService
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

        SellerProfileSupport.applySellerIdentityUpdates(existingSeller, request);
        SellerProfileSupport.validatePrimaryEmailUpdate(existingSeller, request);
        SellerProfileSupport.ensureProfileSections(existingSeller);

        String requestedGstin = SellerProfileSupport.resolveRequestedGstin(request);
        boolean shouldUpdateGstProfile = SellerProfileSupport.shouldUpdateGstProfile(request, requestedGstin);
        if (shouldUpdateGstProfile) {
            SellerGstProfileSupport.applySellerGstProfile(
                    existingSeller,
                    request.getGstRegistrationType(),
                    requestedGstin,
                    request.getGstDeclarationAccepted(),
                    gstOnboardingPolicy,
                    enforceActiveGstinOnSignup,
                    gstinVerificationService
            );
        }

        SellerProfileSupport.mergeProfileDetails(existingSeller, request);

        return sellerRepository.save(existingSeller);
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
