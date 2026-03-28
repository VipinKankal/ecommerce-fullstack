package com.example.ecommerce.auth.service.impl;

import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.modal.VerificationCode;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.repository.VerificationCodeRepository;
import com.example.ecommerce.auth.request.LoginRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.auth.response.SignupRequest;
import com.example.ecommerce.auth.service.AuthService;
import com.example.ecommerce.auth.service.EmailService;
import com.example.ecommerce.auth.service.LoginSessionService;
import com.example.ecommerce.common.utils.OtpUtil;
import com.example.ecommerce.common.exceptions.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private static final String SELLER_NOT_REGISTERED_MESSAGE =
            "No seller account found with this email. Please register first.";
    private static final String CUSTOMER_NOT_REGISTERED_MESSAGE =
            "No customer account found with this email. Please sign up first.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CartRepository cartRepository;
    private final JwtProvider jwtProvider;
    private final VerificationCodeRepository verificationCodeRepository;
    private final EmailService emailService;
    private final CustomUserServiceImpl customUserService;
    private final SellerRepository sellerRepository;
    private final LoginSessionService loginSessionService;

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int OTP_REQUEST_LIMIT = 5;
    private static final int OTP_VERIFY_LIMIT = 10;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 10;
    private static final Map<String, RateLimitWindow> SEND_OTP_RATE_LIMIT = new ConcurrentHashMap<>();
    private static final Map<String, RateLimitWindow> VERIFY_OTP_RATE_LIMIT = new ConcurrentHashMap<>();


    @Override
    @org.springframework.transaction.annotation.Transactional
    public void sendLoginOtp(String email,UserRole role) throws Exception {
        email = normalizeEmail(email);
        String STRING_PREFIX = "signing_";
        boolean loginStyleRequest = false;

        if (email.startsWith(STRING_PREFIX)) {
            email = email.substring(STRING_PREFIX.length());
            loginStyleRequest = true;
        }

        UserRole resolvedRole = role == null ? UserRole.ROLE_CUSTOMER : role;
        enforceRateLimit(SEND_OTP_RATE_LIMIT, email, OTP_REQUEST_LIMIT, "Too many OTP requests. Try again later.");

        if (resolvedRole == UserRole.ROLE_SELLER) {
            Seller seller = sellerRepository.findByEmail(email);
            if (seller == null) {
                throw AuthException.sellerNotRegistered(email, SELLER_NOT_REGISTERED_MESSAGE);
            }
        } else if (loginStyleRequest) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                throw AuthException.customerNotRegistered(email, CUSTOMER_NOT_REGISTERED_MESSAGE);
            }
        }

        verificationCodeRepository.deleteByEmail(email);

        String otp = OtpUtil.generateOtp();
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setOtp(otp);
        verificationCode.setEmail(email);
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        verificationCode.setAttempts(0);
        verificationCode.setConsumed(false);
        verificationCodeRepository.save(verificationCode);

        String subject = "Your Login / Signup OTP";
        String text = "Your login / Signup OTP is -" +  otp;

        emailService.sendVerificationEmail(email, subject, otp, text);

    }

    @Override
    public String createSignup(SignupRequest request) throws Exception {
        String normalizedEmail = normalizeEmail(request.getEmail());
        request.setEmail(normalizedEmail);
        enforceRateLimit(VERIFY_OTP_RATE_LIMIT, normalizedEmail, OTP_VERIFY_LIMIT, "Too many OTP verifications. Try again later.");

        VerificationCode verificationCode = verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(request.getEmail());
        validateAndTrackOtp(verificationCode, request.getOtp());

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null){
            User cratedUser = new User();
            cratedUser.setFullName(request.getFullName());
            cratedUser.setEmail(request.getEmail());
            cratedUser.setRole(UserRole.ROLE_CUSTOMER);
            cratedUser.setAccountStatus(AccountStatus.ACTIVE);
            cratedUser.setMobileNumber("7775870752");
            cratedUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user = userRepository.save(cratedUser);

            Cart cart = new Cart();
            cart.setUser(user);
            cartRepository.save(cart);
        }
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(UserRole.ROLE_CUSTOMER.toString()));

        Authentication authentication = new UsernamePasswordAuthenticationToken(request.getEmail(), null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        verificationCodeRepository.delete(verificationCode);

        String sessionId = loginSessionService.openSession(authentication);
        return jwtProvider.generateToken(authentication, sessionId);
    }

    @Override
    public AuthResponse signing(LoginRequest request) throws Exception {

        String username = normalizeEmail(request.getEmail());
        String otp = request.getOtp();
        enforceRateLimit(VERIFY_OTP_RATE_LIMIT, username, OTP_VERIFY_LIMIT, "Too many OTP verifications. Try again later.");

        Authentication authentication = authenticate(username, otp);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String sessionId = loginSessionService.openSession(authentication);
        String token = jwtProvider.generateToken(authentication, sessionId);
        AuthResponse authResponse = new AuthResponse();
        authResponse.setJwt(token);
        authResponse.setMessage("Login successful");

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        String roleName = authorities.isEmpty()?null:authorities.iterator().next().getAuthority();

        authResponse.setRole(UserRole.valueOf(roleName));

        return authResponse;
    }

    private Authentication authenticate(String username, String otp) throws Exception {
        UserDetails userDetails = customUserService.loadUserByUsername(username);

        String SELLER_PREFIX = "seller_";
        if (username.startsWith(SELLER_PREFIX)){
            username= username.substring(SELLER_PREFIX.length());
        }

        if (userDetails==null) {
            throw AuthException.invalidCredentials();
        }
        VerificationCode verificationCode = verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(username);
        validateAndTrackOtp(verificationCode, otp);
        verificationCodeRepository.delete(verificationCode);
        reactivateCustomerIfNeeded(username);
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private void validateAndTrackOtp(VerificationCode verificationCode, String otp) throws Exception {
        String normalizedOtp = otp == null ? null : otp.trim();
        if (verificationCode == null) {
            throw AuthException.invalidOtp();
        }

        if (Boolean.TRUE.equals(verificationCode.getConsumed())) {
            throw AuthException.otpAlreadyUsed();
        }

        if (verificationCode.getExpiresAt() == null || LocalDateTime.now().isAfter(verificationCode.getExpiresAt())) {
            throw AuthException.otpExpired();
        }

        Integer attempts = verificationCode.getAttempts() == null ? 0 : verificationCode.getAttempts();
        if (attempts >= MAX_OTP_ATTEMPTS) {
            throw AuthException.otpAttemptLimitExceeded();
        }

        if (normalizedOtp == null || normalizedOtp.length() != 6 || !normalizedOtp.chars().allMatch(Character::isDigit)) {
            verificationCode.setAttempts(attempts + 1);
            verificationCodeRepository.save(verificationCode);
            throw AuthException.invalidOtp();
        }

        if (!verificationCode.getOtp().equals(normalizedOtp)) {
            verificationCode.setAttempts(attempts + 1);
            verificationCodeRepository.save(verificationCode);
            throw AuthException.invalidOtp();
        }
    }

    private void enforceRateLimit(
            Map<String, RateLimitWindow> bucket,
            String key,
            int maxRequests,
            String message
    ) throws Exception {
        LocalDateTime now = LocalDateTime.now();
        RateLimitWindow window = bucket.get(key);

        if (window == null || now.isAfter(window.windowStart.plusMinutes(RATE_LIMIT_WINDOW_MINUTES))) {
            bucket.put(key, new RateLimitWindow(1, now));
            return;
        }

        if (window.count >= maxRequests) {
            throw AuthException.otpRateLimitExceeded(message);
        }

        window.count++;
        bucket.put(key, window);
    }

    private void reactivateCustomerIfNeeded(String username) {
        User user = userRepository.findByEmail(username).orElse(null);
        if (user == null) {
            return;
        }
        AccountStatus status = user.getAccountStatus();
        if (status == null || status == AccountStatus.DEACTIVATED) {
            user.setAccountStatus(AccountStatus.ACTIVE);
            userRepository.save(user);
        }
    }

    private static class RateLimitWindow {
        private int count;
        private LocalDateTime windowStart;

        private RateLimitWindow(int count, LocalDateTime windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }
    }

}








