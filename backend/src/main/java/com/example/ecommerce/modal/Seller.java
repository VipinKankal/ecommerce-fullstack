package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.persistence.AccountStatusConverter;
import com.example.ecommerce.common.persistence.UserRoleConverter;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String sellerName;
    private String mobileNumber;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private LocalDate dateOfBirth;

    @Embedded
    private BusinessDetails businessDetails = new BusinessDetails();

    @Embedded
    private BankDetails bankDetails = new BankDetails();

    @Embedded
    private KycDetails kycDetails = new KycDetails();

    @Embedded
    private StoreDetails storeDetails = new StoreDetails();

    @OneToOne(cascade = CascadeType.ALL)
    private Address pickupAddress = new Address();

    private String GSTIN;
    private String gstRegistrationType;
    private String gstOnboardingPolicy;
    private Boolean gstDeclarationAccepted = false;
    private String gstComplianceStatus;

    @Convert(converter = UserRoleConverter.class)
    private UserRole role = UserRole.ROLE_SELLER;

    @Column(name = "is_email_verified")
    private Boolean emailVerified = false;

    @Convert(converter = AccountStatusConverter.class)
    private AccountStatus accountStatus = AccountStatus.PENDING_VERIFICATION;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (role == null) {
            role = UserRole.ROLE_SELLER;
        }
        if (accountStatus == null) {
            accountStatus = AccountStatus.PENDING_VERIFICATION;
        }
    }
}



