package com.example.ecommerce.auth.service;

import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.auth.request.LoginRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.auth.response.SignupRequest;

public interface AuthService {

    void sendLoginOtp(String email, UserRole role) throws Exception;
    String createSignup(SignupRequest request) throws Exception;
    AuthResponse signing(LoginRequest request) throws Exception;
}



