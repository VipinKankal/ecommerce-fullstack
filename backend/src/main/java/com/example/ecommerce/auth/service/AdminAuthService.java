package com.example.ecommerce.auth.service;

import com.example.ecommerce.admin.request.AdminLoginRequest;
import com.example.ecommerce.admin.request.AdminSignupRequest;
import com.example.ecommerce.auth.response.AuthResponse;

public interface AdminAuthService {
    AuthResponse signup(AdminSignupRequest request) throws Exception;
    AuthResponse signin(AdminLoginRequest request) throws Exception;
}




