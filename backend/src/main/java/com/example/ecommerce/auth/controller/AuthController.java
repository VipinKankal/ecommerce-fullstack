package com.example.ecommerce.auth.controller;

import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.auth.request.LoginOtpRequest;
import com.example.ecommerce.auth.request.LoginRequest;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.auth.response.SignupRequest;
import com.example.ecommerce.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> createUserHandler(@Valid @RequestBody SignupRequest request) throws Exception {

        String jwt = authService.createSignup(request);

        AuthResponse response = new AuthResponse();
        response.setJwt(jwt);
        response.setMessage("User created successfully");
        response.setRole(UserRole.ROLE_CUSTOMER);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/sent/login-signup-otp")
    public ResponseEntity<ApiResponse> sentOtpHandler(@Valid @RequestBody LoginOtpRequest request) throws Exception {

        authService.sendLoginOtp(request.getEmail(),request.getRole());
        ApiResponse response = new ApiResponse();
        response.setMessage("otp sent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> loginHandler(@Valid @RequestBody LoginRequest request) throws Exception {
        AuthResponse authResponse = authService.signing(request);
        return ResponseEntity.ok(authResponse);
    }

}




