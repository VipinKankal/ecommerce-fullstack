package com.example.ecommerce.modal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
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
    private Boolean active = true;

    @jakarta.persistence.PrePersist
    @jakarta.persistence.PreUpdate
    private void ensureDefaults() {
        if (active == null) {
            active = true;
        }
    }

}




