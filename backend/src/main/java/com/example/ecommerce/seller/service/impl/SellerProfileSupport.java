package com.example.ecommerce.seller.service.impl;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.BankDetails;
import com.example.ecommerce.modal.BusinessDetails;
import com.example.ecommerce.modal.KycDetails;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.StoreDetails;
import com.example.ecommerce.seller.request.SellerSignupRequest;
import com.example.ecommerce.seller.request.SellerUpdateRequest;

final class SellerProfileSupport {

    private SellerProfileSupport() {
    }

    static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    static Seller buildNewSeller(SellerSignupRequest request, String normalizedEmail, String encodedPassword) {
        Seller seller = new Seller();
        seller.setEmail(normalizedEmail);
        seller.setPassword(encodedPassword);
        seller.setSellerName(request.getSellerName());
        seller.setPickupAddress(request.getPickupAddress() == null ? new Address() : request.getPickupAddress());
        seller.setRole(UserRole.ROLE_SELLER);
        seller.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
        seller.setMobileNumber(request.getMobileNumber());
        seller.setDateOfBirth(request.getDateOfBirth());
        seller.setBankDetails(request.getBankDetails() == null ? new BankDetails() : request.getBankDetails());
        seller.setBusinessDetails(request.getBusinessDetails() == null ? new BusinessDetails() : request.getBusinessDetails());
        seller.setKycDetails(request.getKycDetails() == null ? new KycDetails() : request.getKycDetails());
        seller.setStoreDetails(request.getStoreDetails() == null ? new StoreDetails() : request.getStoreDetails());
        return seller;
    }

    static void validatePrimaryEmailUpdate(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getEmail() != null
                && !request.getEmail().trim().equalsIgnoreCase(existingSeller.getEmail())) {
            throw new IllegalArgumentException(
                    "Use seller email verification flow to update the primary login email."
            );
        }
    }

    static void applySellerIdentityUpdates(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getSellerName() != null) {
            existingSeller.setSellerName(request.getSellerName());
        }
        if (request.getMobileNumber() != null) {
            existingSeller.setMobileNumber(request.getMobileNumber());
        }
        if (request.getDateOfBirth() != null) {
            existingSeller.setDateOfBirth(request.getDateOfBirth());
        }
    }

    static void ensureProfileSections(Seller seller) {
        if (seller.getBusinessDetails() == null) {
            seller.setBusinessDetails(new BusinessDetails());
        }
        if (seller.getBankDetails() == null) {
            seller.setBankDetails(new BankDetails());
        }
        if (seller.getKycDetails() == null) {
            seller.setKycDetails(new KycDetails());
        }
        if (seller.getStoreDetails() == null) {
            seller.setStoreDetails(new StoreDetails());
        }
        if (seller.getPickupAddress() == null) {
            seller.setPickupAddress(new Address());
        }
    }

    static String resolveRequestedGstin(SellerUpdateRequest request) {
        String requestedGstin = request.getGSTIN();
        if (request.getBusinessDetails() != null
                && request.getBusinessDetails().getGstNumber() != null
                && !request.getBusinessDetails().getGstNumber().isBlank()) {
            requestedGstin = request.getBusinessDetails().getGstNumber();
        }
        return requestedGstin;
    }

    static boolean shouldUpdateGstProfile(SellerUpdateRequest request, String requestedGstin) {
        return request.getGstRegistrationType() != null
                || request.getGstDeclarationAccepted() != null
                || requestedGstin != null;
    }

    static void mergeProfileDetails(Seller existingSeller, SellerUpdateRequest request) {
        mergeBusinessDetails(existingSeller, request);
        mergeBankDetails(existingSeller, request);
        mergePickupAddress(existingSeller, request);
        mergeKycDetails(existingSeller, request);
        mergeStoreDetails(existingSeller, request);
    }

    private static void mergeBusinessDetails(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getBusinessDetails() == null) {
            return;
        }
        BusinessDetails current = existingSeller.getBusinessDetails();
        BusinessDetails incoming = request.getBusinessDetails();
        if (incoming.getBusinessName() != null) {
            current.setBusinessName(incoming.getBusinessName());
        }
        if (incoming.getBusinessType() != null) {
            current.setBusinessType(incoming.getBusinessType());
        }
        current.setGstNumber(existingSeller.getGSTIN());
        if (incoming.getPanNumber() != null) {
            current.setPanNumber(incoming.getPanNumber());
        }
    }

    private static void mergeBankDetails(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getBankDetails() == null) {
            return;
        }
        BankDetails current = existingSeller.getBankDetails();
        BankDetails incoming = request.getBankDetails();
        if (incoming.getAccountHolderName() != null) {
            current.setAccountHolderName(incoming.getAccountHolderName());
        }
        if (incoming.getBankName() != null) {
            current.setBankName(incoming.getBankName());
        }
        if (incoming.getAccountNumber() != null) {
            current.setAccountNumber(incoming.getAccountNumber());
        }
        if (incoming.getIfscCode() != null) {
            current.setIfscCode(incoming.getIfscCode());
        }
    }

    private static void mergePickupAddress(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getPickupAddress() == null) {
            return;
        }
        Address current = existingSeller.getPickupAddress();
        Address incoming = request.getPickupAddress();
        if (incoming.getName() != null) {
            current.setName(incoming.getName());
        }
        if (incoming.getStreet() != null) {
            current.setStreet(incoming.getStreet());
        }
        if (incoming.getLocality() != null) {
            current.setLocality(incoming.getLocality());
        }
        if (incoming.getAddress() != null) {
            current.setAddress(incoming.getAddress());
        }
        if (incoming.getCity() != null) {
            current.setCity(incoming.getCity());
        }
        if (incoming.getState() != null) {
            current.setState(incoming.getState());
        }
        if (incoming.getPinCode() != null) {
            current.setPinCode(incoming.getPinCode());
        }
        if (incoming.getMobileNumber() != null) {
            current.setMobileNumber(incoming.getMobileNumber());
        }
        if (incoming.getCountry() != null) {
            current.setCountry(incoming.getCountry());
        }
    }

    private static void mergeKycDetails(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getKycDetails() == null) {
            return;
        }
        KycDetails current = existingSeller.getKycDetails();
        KycDetails incoming = request.getKycDetails();
        if (incoming.getPanCardUrl() != null) {
            current.setPanCardUrl(incoming.getPanCardUrl());
        }
        if (incoming.getAadhaarCardUrl() != null) {
            current.setAadhaarCardUrl(incoming.getAadhaarCardUrl());
        }
        if (incoming.getGstCertificateUrl() != null) {
            current.setGstCertificateUrl(incoming.getGstCertificateUrl());
        }
    }

    private static void mergeStoreDetails(Seller existingSeller, SellerUpdateRequest request) {
        if (request.getStoreDetails() == null) {
            return;
        }
        StoreDetails current = existingSeller.getStoreDetails();
        StoreDetails incoming = request.getStoreDetails();
        if (incoming.getStoreName() != null) {
            current.setStoreName(incoming.getStoreName());
        }
        if (incoming.getStoreLogo() != null) {
            current.setStoreLogo(incoming.getStoreLogo());
        }
        if (incoming.getStoreDescription() != null) {
            current.setStoreDescription(incoming.getStoreDescription());
        }
        if (incoming.getPrimaryCategory() != null) {
            current.setPrimaryCategory(incoming.getPrimaryCategory());
        }
        if (incoming.getSupportEmail() != null) {
            current.setSupportEmail(incoming.getSupportEmail());
        }
        if (incoming.getSupportPhone() != null) {
            current.setSupportPhone(incoming.getSupportPhone());
        }
    }
}
