package com.example.ecommerce.modal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BankDetails {
    private String accountHolderName;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
}



