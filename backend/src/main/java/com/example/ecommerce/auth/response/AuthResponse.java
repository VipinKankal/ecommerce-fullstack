package com.example.ecommerce.auth.response;

import com.example.ecommerce.common.domain.UserRole;
import lombok.Data;

@Data
public class AuthResponse {
    private String jwt;
    private String message;
    private UserRole role;
}




