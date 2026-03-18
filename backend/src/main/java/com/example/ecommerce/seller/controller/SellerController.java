package com.example.ecommerce.seller.controller;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.exceptions.SellerException;
import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.SellerReport;
import com.example.ecommerce.modal.VerificationCode;
import com.example.ecommerce.repository.VerificationCodeRepository;
import com.example.ecommerce.auth.request.LoginRequest;
import com.example.ecommerce.seller.request.SellerSignupRequest;
import com.example.ecommerce.seller.request.SellerUpdateRequest;
import com.example.ecommerce.seller.request.SellerVerifyEmailRequest;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.seller.response.SellerResponse;
import com.example.ecommerce.auth.service.AuthService;
import com.example.ecommerce.auth.service.EmailService;
import com.example.ecommerce.seller.service.SellerReportService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.common.utils.OtpUtil;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
        emailService.sendVerificationEmail(request.getEmail().trim().toLowerCase(), verificationCode.getOtp(), subject, text + frontendUrl);
        return new ResponseEntity<>(ResponseMapper.toSellerResponse(savedSeller), HttpStatus.CREATED);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerResponse> getSellerProfile(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        return new ResponseEntity<>(ResponseMapper.toSellerResponse(seller), HttpStatus.OK);
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
            @RequestHeader("Authorization") String jwt,
            @Valid @RequestBody SellerUpdateRequest request
    ) throws Exception {
        Seller profile = sellerService.getSellerProfile(jwt);
        Seller updatedSeller = sellerService.updateSeller(profile.getId(), request);
        return ResponseEntity.ok(ResponseMapper.toSellerResponse(updatedSeller));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSeller(@PathVariable Long id) throws Exception {
        sellerService.deleteSeller(id);
        return ResponseEntity.noContent().build();
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
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        SellerReport report = sellerReportService.getSellerReport(seller);
        return new ResponseEntity<>(report, HttpStatus.OK);
    }
}




