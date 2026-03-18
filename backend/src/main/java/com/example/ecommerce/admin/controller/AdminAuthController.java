package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.request.AdminLoginRequest;
import com.example.ecommerce.admin.request.AdminSignupRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.auth.service.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody AdminSignupRequest request) throws Exception {
        return ResponseEntity.ok(adminAuthService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AdminLoginRequest request) throws Exception {
        return ResponseEntity.ok(adminAuthService.signin(request));
    }
}




