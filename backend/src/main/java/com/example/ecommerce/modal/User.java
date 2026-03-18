package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.persistence.AccountStatusConverter;
import com.example.ecommerce.common.persistence.UserRoleConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @EqualsAndHashCode.Include
    private Long id;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    private String mobileNumber;

    @Convert(converter = UserRoleConverter.class)
    private UserRole role = UserRole.ROLE_CUSTOMER;

    @Convert(converter = AccountStatusConverter.class)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @OneToMany
    private Set<Address> addresses = new HashSet<>();

    @ManyToMany
    @JsonIgnore
    private Set<Coupon> usedCoupons = new HashSet<>();

    @PrePersist
    @PreUpdate
    private void ensureStatus() {
        if (role == null) {
            role = UserRole.ROLE_CUSTOMER;
        }
        if (accountStatus == null) {
            accountStatus = AccountStatus.ACTIVE;
        }
    }
}



