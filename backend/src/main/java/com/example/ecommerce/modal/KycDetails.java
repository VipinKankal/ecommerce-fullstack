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
public class KycDetails {
    @Column(columnDefinition = "LONGTEXT")
    private String panCardUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String aadhaarCardUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String gstCertificateUrl;
}



