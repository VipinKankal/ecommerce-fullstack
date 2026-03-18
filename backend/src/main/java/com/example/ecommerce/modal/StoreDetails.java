package com.example.ecommerce.modal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class StoreDetails {
    private String storeName;

    @Column(columnDefinition = "LONGTEXT")
    private String storeLogo;

    @Column(columnDefinition = "LONGTEXT")
    private String storeDescription;
    private String primaryCategory;
    private String supportEmail;
    private String supportPhone;
}



