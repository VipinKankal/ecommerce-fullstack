package com.example.ecommerce.admin.response;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import lombok.Data;

@Data
public class AdminUserSummaryResponse {
    private Long id;
    private String fullName;
    private String email;
    private String mobileNumber;
    private UserRole role;
    private AccountStatus accountStatus;
}




