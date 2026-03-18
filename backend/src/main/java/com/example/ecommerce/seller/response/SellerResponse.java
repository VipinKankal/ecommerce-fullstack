package com.example.ecommerce.seller.response;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SellerResponse {
    private Long id;
    private String sellerName;
    private String mobileNumber;
    private String email;
    private LocalDate dateOfBirth;
    private String GSTIN;
    private Boolean emailVerified;
    private AccountStatus accountStatus;
    private UserRole role;
    private BusinessDetailsPayload businessDetails;
    private BankDetailsPayload bankDetails;
    private KycDetailsPayload kycDetails;
    private StoreDetailsPayload storeDetails;
    private AddressPayload pickupAddress;

    @Data
    public static class BusinessDetailsPayload {
        private String businessName;
        private String businessType;
        private String gstNumber;
        private String panNumber;
    }

    @Data
    public static class BankDetailsPayload {
        private String accountHolderName;
        private String bankName;
        private String accountNumber;
        private String ifscCode;
    }

    @Data
    public static class KycDetailsPayload {
        private String panCardUrl;
        private String aadhaarCardUrl;
        private String gstCertificateUrl;
    }

    @Data
    public static class StoreDetailsPayload {
        private String storeName;
        private String storeLogo;
        private String storeDescription;
        private String primaryCategory;
        private String supportEmail;
        private String supportPhone;
    }

    @Data
    public static class AddressPayload {
        private Long id;
        private String name;
        private String street;
        private String locality;
        private String address;
        private String city;
        private String state;
        private String pinCode;
        private String mobileNumber;
        private String country;
    }
}




