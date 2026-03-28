package com.example.ecommerce.auth.service.impl;

import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.admin.request.AdminLoginRequest;
import com.example.ecommerce.admin.request.AdminSignupRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.auth.service.AdminAuthService;
import com.example.ecommerce.auth.service.LoginSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAuthServiceImpl implements AdminAuthService {

    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final LoginSessionService loginSessionService;

    @Override
    public AuthResponse signup(AdminSignupRequest request) throws Exception {
        String email = normalizeEmail(request.getEmail());
        ensureEmailAvailable(email);

        User admin = new User();
        admin.setFullName(request.getFullName().trim());
        admin.setEmail(email);
        admin.setMobileNumber(request.getMobileNumber().trim());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(UserRole.ROLE_ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(admin);

        Authentication authentication = buildAuthentication(email);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return buildResponse(authentication, "Admin account created successfully");
    }

    @Override
    public AuthResponse signin(AdminLoginRequest request) throws Exception {
        String email = normalizeEmail(request.getEmail());
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (admin.getRole() != UserRole.ROLE_ADMIN) {
            throw new BadCredentialsException("Admin access required");
        }

        if (admin.getAccountStatus() != null && admin.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadCredentialsException("Admin account is not active");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        Authentication authentication = buildAuthentication(email);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return buildResponse(authentication, "Admin login successful");
    }

    private void ensureEmailAvailable(String email) throws Exception {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new Exception("Email already in use");
        }
        Seller seller = sellerRepository.findByEmail(email);
        if (seller != null) {
            throw new Exception("Email already in use");
        }
    }

    private Authentication buildAuthentication(String email) {
        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority(UserRole.ROLE_ADMIN.name()))
        );
    }

    private AuthResponse buildResponse(Authentication authentication, String message) {
        AuthResponse response = new AuthResponse();
        String sessionId = loginSessionService.openSession(authentication);
        response.setJwt(jwtProvider.generateToken(authentication, sessionId));
        response.setMessage(message);
        response.setRole(UserRole.ROLE_ADMIN);
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}






