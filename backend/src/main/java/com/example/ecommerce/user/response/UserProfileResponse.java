package com.example.ecommerce.user.response;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String mobileNumber;
    private UserRole role;
    private AccountStatus accountStatus;
    private List<UserAddressResponse> addresses = new ArrayList<>();
}




