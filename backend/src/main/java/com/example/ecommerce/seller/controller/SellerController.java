package com.example.ecommerce.seller.controller;

import com.example.ecommerce.auth.request.RequestEmailChangeOtpRequest;
import com.example.ecommerce.common.configuration.AuthCookieService;
import com.example.ecommerce.auth.request.VerifyEmailChangeOtpRequest;
import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.exceptions.SellerException;
import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.SellerReport;
import com.example.ecommerce.modal.VerificationCode;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.VerificationCodeRepository;
import com.example.ecommerce.auth.request.LoginRequest;
import com.example.ecommerce.seller.request.SellerSignupRequest;
import com.example.ecommerce.seller.request.SellerUpdateRequest;
import com.example.ecommerce.seller.request.SellerVerifyEmailRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.seller.response.SellerResponse;
import com.example.ecommerce.auth.service.AuthService;
import com.example.ecommerce.auth.service.EmailService;
import com.example.ecommerce.auth.service.LoginSessionService;
import com.example.ecommerce.common.response.LoginHistorySummaryResponse;
import com.example.ecommerce.seller.service.SellerReportService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.common.utils.OtpUtil;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/sellers")
public class SellerController {

    private final SellerService sellerService;
    private final VerificationCodeRepository verificationCodeRepository;
    private final AuthService authService;
    private final EmailService emailService;
    private final SellerReportService sellerReportService;
    private final SellerRepository sellerRepository;
    private final JwtProvider jwtProvider;
    private final AuthCookieService authCookieService;
    private final LoginSessionService loginSessionService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AuthResponse> loginSeller(
            @RequestBody LoginRequest request
    ) throws Exception {
        String email = request.getEmail();
        request.setEmail("seller_" + email);
        AuthResponse authResponse = authService.signing(request);
        return ResponseEntity.ok(authResponse);
    }

    @PatchMapping("/verifyEmail/{otp}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<SellerResponse> verifySellerEmail(
            @PathVariable String otp,
            @Valid @RequestBody SellerVerifyEmailRequest request
    ) throws Exception {
        Seller seller = sellerService.verifyEmail(request.getEmail(), otp);
        return new ResponseEntity<>(ResponseMapper.toSellerResponse(seller), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<SellerResponse> createSeller(
            @Valid @RequestBody SellerSignupRequest request
    ) throws Exception, MessagingException {
        Seller savedSeller = sellerService.createSeller(request);

        String otp = OtpUtil.generateOtp();
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setOtp(otp);
        verificationCode.setEmail(request.getEmail().trim().toLowerCase());
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCode.setConsumed(false);
        verificationCode.setAttempts(0);
        verificationCodeRepository.deleteByEmail(request.getEmail().trim().toLowerCase());
        verificationCodeRepository.save(verificationCode);

        String subject = "Verify your email";
        String text = "Your email verification OTP is -" + otp;
        String frontendUrl = frontendBaseUrl.replaceAll("/$", "") + "/seller/verify-email";
        emailService.sendVerificationEmail(
                request.getEmail().trim().toLowerCase(),
                subject,
                verificationCode.getOtp(),
                text + "\n" + frontendUrl
        );
        return new ResponseEntity<>(ResponseMapper.toSellerResponse(savedSeller), HttpStatus.CREATED);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerResponse> getSellerProfile(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        SellerResponse response = ResponseMapper.toSellerResponse(seller);
        LoginHistorySummaryResponse loginHistory = loginSessionService.getLoginHistory(seller.getEmail(), seller.getRole());
        response.setActiveDeviceCount(loginHistory.getActiveDeviceCount());
        response.setLoginHistory(loginHistory.getLoginHistory());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellerResponse> getSellerById(@PathVariable Long id) throws SellerException {
        Seller seller = sellerService.getSellerById(id);
        return new ResponseEntity<>(ResponseMapper.toSellerResponse(seller), HttpStatus.OK);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SellerResponse>> getAllSellers(
            @RequestParam(required = false) AccountStatus status
    ) {
        List<Seller> sellers = sellerService.getAllSellers(status);
        return ResponseEntity.ok(ResponseMapper.toSellerResponses(sellers));
    }

    @PatchMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerResponse> updateSeller(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody SellerUpdateRequest request
    ) throws Exception {
        Seller profile = sellerService.getSellerProfile(jwt);
        Seller updatedSeller = sellerService.updateSeller(profile.getId(), request);
        return ResponseEntity.ok(ResponseMapper.toSellerResponse(updatedSeller));
    }

    @PostMapping("/email/change/request-otp")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> requestSellerEmailChangeOtp(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody RequestEmailChangeOtpRequest request
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        String normalizedNewEmail = normalizeEmail(request.getNewEmail());

        if (normalizedNewEmail.equalsIgnoreCase(seller.getEmail())) {
            throw new IllegalArgumentException("New email must be different from current email");
        }
        if (sellerRepository.findByEmail(normalizedNewEmail) != null) {
            throw new IllegalArgumentException("Email already in use");
        }

        verificationCodeRepository.deleteByEmail(normalizedNewEmail);
        String otp = OtpUtil.generateOtp();

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(normalizedNewEmail);
        verificationCode.setOtp(otp);
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCode.setAttempts(0);
        verificationCode.setConsumed(false);
        verificationCodeRepository.save(verificationCode);

        emailService.sendVerificationEmail(
                normalizedNewEmail,
                "Verify your new seller email",
                otp,
                "Your OTP for seller email change is - " + otp
        );

        ApiResponse response = new ApiResponse();
        response.setMessage("OTP sent to new seller email.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/email/change/verify")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuthResponse> verifySellerEmailChangeOtp(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody VerifyEmailChangeOtpRequest request,
            HttpServletResponse httpResponse
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        String normalizedNewEmail = normalizeEmail(request.getNewEmail());
        String normalizedOtp = normalizeOtp(request.getOtp());

        VerificationCode verificationCode =
                verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(normalizedNewEmail);
        if (verificationCode == null) {
            throw new Exception("Invalid OTP");
        }
        if (Boolean.TRUE.equals(verificationCode.getConsumed())) {
            throw new Exception("OTP already used");
        }
        if (verificationCode.getExpiresAt() == null || LocalDateTime.now().isAfter(verificationCode.getExpiresAt())) {
            throw new Exception("OTP expired");
        }
        if (normalizedOtp == null || normalizedOtp.length() != 6 || !normalizedOtp.chars().allMatch(Character::isDigit)) {
            throw new Exception("Invalid OTP");
        }
        if (!verificationCode.getOtp().equals(normalizedOtp)) {
            throw new Exception("Invalid OTP");
        }
        if (sellerRepository.findByEmail(normalizedNewEmail) != null) {
            throw new Exception("Email already in use");
        }

        verificationCode.setConsumed(true);
        verificationCodeRepository.save(verificationCode);

        seller.setEmail(normalizedNewEmail);
        sellerRepository.save(seller);
        verificationCodeRepository.delete(verificationCode);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                normalizedNewEmail,
                null,
                Collections.singletonList(new SimpleGrantedAuthority(seller.getRole().name()))
        );
        String refreshedJwt = jwtProvider.generateToken(authentication, loginSessionService.currentSessionId());
        authCookieService.writeAuthCookie(httpResponse, refreshedJwt);

        AuthResponse response = new AuthResponse();
        response.setJwt(refreshedJwt);
        response.setRole(seller.getRole());
        response.setMessage("Seller email updated successfully.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteSeller(@PathVariable Long id) throws Exception {
        sellerService.deleteSeller(id);
        ApiResponse response = new ApiResponse();
        response.setMessage("Seller deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellerResponse> updateAccountStatus(
            @PathVariable Long id,
            @RequestParam AccountStatus status
    ) throws Exception {
        return ResponseEntity.ok(ResponseMapper.toSellerResponse(sellerService.updateSellerAccountStatus(id, status)));
    }

    @GetMapping("/report")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerReport> getSellerReport(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        SellerReport report = sellerReportService.getSellerReport(seller);
        return new ResponseEntity<>(report, HttpStatus.OK);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeOtp(String otp) {
        return otp == null ? null : otp.trim();
    }
}








