package com.example.ecommerce.modal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusinessDetails {
    private String businessName;
    private String businessType;
    private String gstNumber;
    private String panNumber;
}



