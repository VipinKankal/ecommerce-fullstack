package com.example.ecommerce.seller.request;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.BankDetails;
import com.example.ecommerce.modal.BusinessDetails;
import com.example.ecommerce.modal.KycDetails;
import com.example.ecommerce.modal.StoreDetails;
import jakarta.validation.Valid;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SellerUpdateRequest {
    private String sellerName;
    private String mobileNumber;
    private String email;
    private LocalDate dateOfBirth;
    private String GSTIN;
    private String gstRegistrationType;
    private Boolean gstDeclarationAccepted;

    @Valid
    private BusinessDetails businessDetails;

    @Valid
    private BankDetails bankDetails;

    @Valid
    private Address pickupAddress;

    @Valid
    private KycDetails kycDetails;

    @Valid
    private StoreDetails storeDetails;
}




