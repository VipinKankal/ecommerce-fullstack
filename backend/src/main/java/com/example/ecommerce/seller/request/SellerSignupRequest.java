package com.example.ecommerce.seller.request;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.BankDetails;
import com.example.ecommerce.modal.BusinessDetails;
import com.example.ecommerce.modal.KycDetails;
import com.example.ecommerce.modal.StoreDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SellerSignupRequest {
    @NotBlank(message = "Seller name is required")
    private String sellerName;

    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private LocalDate dateOfBirth;

    @NotBlank(message = "GSTIN is required")
    @Pattern(
            regexp = "^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][A-Za-z0-9]Z[A-Za-z0-9]$",
            message = "Invalid GSTIN format"
    )
    private String GSTIN;

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




