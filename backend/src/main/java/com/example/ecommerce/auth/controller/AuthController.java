package com.example.ecommerce.auth.controller;

import com.example.ecommerce.auth.request.LoginOtpRequest;
import com.example.ecommerce.auth.request.LoginRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.auth.response.SignupRequest;
import com.example.ecommerce.auth.service.AuthService;
import com.example.ecommerce.common.configuration.AuthCookieService;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> createUserHandler(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse httpResponse
    ) throws Exception {

        String jwt = authService.createSignup(request);
        authCookieService.writeAuthCookie(httpResponse, jwt);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setJwt(jwt);
        authResponse.setMessage("User created successfully");
        authResponse.setRole(UserRole.ROLE_CUSTOMER);

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/sent/login-signup-otp")
    public ResponseEntity<ApiResponse> sentOtpHandler(@Valid @RequestBody LoginOtpRequest request) throws Exception {

        authService.sendLoginOtp(request.getEmail(), request.getRole());
        ApiResponse response = new ApiResponse();
        response.setMessage("otp sent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> loginHandler(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse
    ) throws Exception {
        AuthResponse authResponse = authService.signing(request);
        authCookieService.writeAuthCookie(httpResponse, authResponse.getJwt());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logoutHandler(HttpServletResponse httpResponse) {
        authCookieService.clearAuthCookie(httpResponse);
        SecurityContextHolder.clearContext();

        ApiResponse response = new ApiResponse();
        response.setMessage("Logout successful");
        return ResponseEntity.ok(response);
    }
}
