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
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
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
        newSeller.setGSTIN(request.getGSTIN());
        newSeller.setRole(UserRole.ROLE_SELLER);
        newSeller.setAccountStatus(AccountStatus.ACTIVE);
        newSeller.setMobileNumber(request.getMobileNumber());
        newSeller.setDateOfBirth(request.getDateOfBirth());
        newSeller.setBankDetails(request.getBankDetails() == null ? new BankDetails() : request.getBankDetails());

        BusinessDetails businessDetails = request.getBusinessDetails() == null ? new BusinessDetails() : request.getBusinessDetails();
        if (businessDetails.getGstNumber() == null || businessDetails.getGstNumber().isBlank()) {
            businessDetails.setGstNumber(request.getGSTIN());
        }
        newSeller.setBusinessDetails(businessDetails);
        newSeller.setKycDetails(request.getKycDetails() == null ? new KycDetails() : request.getKycDetails());
        newSeller.setStoreDetails(request.getStoreDetails() == null ? new StoreDetails() : request.getStoreDetails());

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
                .orElseThrow(() -> new SellerException("seller not found with id " + id));
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
        if (request.getGSTIN() != null) {
            existingSeller.setGSTIN(request.getGSTIN());
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

        if (request.getBusinessDetails() != null) {
            BusinessDetails current = existingSeller.getBusinessDetails();
            BusinessDetails incoming = request.getBusinessDetails();
            if (incoming.getBusinessName() != null) current.setBusinessName(incoming.getBusinessName());
            if (incoming.getBusinessType() != null) current.setBusinessType(incoming.getBusinessType());
            if (incoming.getGstNumber() != null) current.setGstNumber(incoming.getGstNumber());
            if (incoming.getPanNumber() != null) current.setPanNumber(incoming.getPanNumber());
            if (incoming.getGstNumber() != null) existingSeller.setGSTIN(incoming.getGstNumber());
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
