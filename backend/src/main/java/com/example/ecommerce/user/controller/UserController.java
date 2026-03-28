package com.example.ecommerce.user.controller;

import com.example.ecommerce.common.configuration.AuthCookieService;
import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.repository.VerificationCodeRepository;
import com.example.ecommerce.auth.request.RequestEmailChangeOtpRequest;
import com.example.ecommerce.user.request.UpdateUserProfileRequest;
import com.example.ecommerce.user.request.UserAddressRequest;
import com.example.ecommerce.auth.request.VerifyEmailChangeOtpRequest;
import com.example.ecommerce.auth.service.LoginSessionService;
import com.example.ecommerce.common.response.LoginHistorySummaryResponse;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.auth.response.AuthResponse;
import com.example.ecommerce.user.response.UserAddressResponse;
import com.example.ecommerce.user.response.UserProfileResponse;
import com.example.ecommerce.auth.service.EmailService;
import com.example.ecommerce.user.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class UserController {

    private final UserService userService;
    private final AddressRepository addressRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final AuthCookieService authCookieService;
    private final LoginSessionService loginSessionService;

    @GetMapping("/auth/users/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<UserProfileResponse> getUserProfileHandler(
            @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(toUserProfileResponse(user));
    }

    @PutMapping("/auth/users/profile")
    @Transactional
    public ResponseEntity<UserProfileResponse> updateUserProfileHandler(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody UpdateUserProfileRequest request
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        user.setFullName(request.getFullName().trim());
        user.setMobileNumber(request.getMobileNumber());
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(toUserProfileResponse(savedUser));
    }

    @PutMapping("/auth/users/account/deactivate")
    @Transactional
    public ResponseEntity<ApiResponse> deactivateAccountHandler(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        user.setAccountStatus(AccountStatus.DEACTIVATED);
        userService.saveUser(user);

        ApiResponse response = new ApiResponse();
        response.setMessage("Account deactivated successfully. You can login again anytime.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/users/addresses")
    @Transactional
    public ResponseEntity<UserProfileResponse> addAddressHandler(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody UserAddressRequest request
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Address address = addressRepository.save(toAddress(request));
        user.getAddresses().add(address);
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(toUserProfileResponse(savedUser));
    }

    @PutMapping("/auth/users/addresses/{addressId}")
    @Transactional
    public ResponseEntity<UserProfileResponse> updateAddressHandler(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long addressId,
            @Valid @RequestBody UserAddressRequest request
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Address address = user.getAddresses().stream()
                .filter(a -> a.getId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> new Exception("Address not found for user"));

        address.setName(request.getName());
        address.setStreet(request.getStreet());
        address.setLocality(request.getLocality());
        address.setAddress(request.getAddress());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPinCode(request.getPinCode());
        address.setMobileNumber(request.getMobileNumber());

        addressRepository.save(address);
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(toUserProfileResponse(savedUser));
    }

    @DeleteMapping("/auth/users/addresses/{addressId}")
    @Transactional
    public ResponseEntity<UserProfileResponse> deleteAddressHandler(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long addressId
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Address address = user.getAddresses().stream()
                .filter(a -> a.getId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> new Exception("Address not found for user"));

        user.getAddresses().remove(address);
        userService.saveUser(user);
        addressRepository.delete(address);
        User refreshed = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(toUserProfileResponse(refreshed));
    }

    @PostMapping("/auth/users/email/change/request-otp")
    @Transactional
    public ResponseEntity<ApiResponse> requestEmailChangeOtp(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody RequestEmailChangeOtpRequest request
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String normalizedNewEmail = normalizeEmail(request.getNewEmail());

        if (normalizedNewEmail.equalsIgnoreCase(user.getEmail())) {
            throw new Exception("New email must be different from current email");
        }
        if (userRepository.findByEmail(normalizedNewEmail).isPresent()) {
            throw new Exception("Email already in use");
        }

        verificationCodeRepository.deleteByEmail(normalizedNewEmail);
        String otp = com.example.ecommerce.common.utils.OtpUtil.generateOtp();

        com.example.ecommerce.modal.VerificationCode verificationCode = new com.example.ecommerce.modal.VerificationCode();
        verificationCode.setEmail(normalizedNewEmail);
        verificationCode.setOtp(otp);
        verificationCode.setCreatedAt(java.time.LocalDateTime.now());
        verificationCode.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(10));
        verificationCode.setAttempts(0);
        verificationCode.setConsumed(false);
        verificationCodeRepository.save(verificationCode);

        emailService.sendVerificationEmail(
                normalizedNewEmail,
                "Verify your new email",
                otp,
                "Your OTP for email change is - " + otp
        );

        ApiResponse response = new ApiResponse();
        response.setMessage("OTP sent to new email");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/users/email/change/verify")
    @Transactional
    public ResponseEntity<AuthResponse> verifyEmailChangeOtp(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @Valid @RequestBody VerifyEmailChangeOtpRequest request,
            HttpServletResponse httpResponse
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String normalizedNewEmail = normalizeEmail(request.getNewEmail());
        String normalizedOtp = normalizeOtp(request.getOtp());

        com.example.ecommerce.modal.VerificationCode verificationCode =
                verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(normalizedNewEmail);
        if (verificationCode == null) {
            throw new Exception("Invalid OTP");
        }
        if (Boolean.TRUE.equals(verificationCode.getConsumed())) {
            throw new Exception("OTP already used");
        }
        if (verificationCode.getExpiresAt() == null || java.time.LocalDateTime.now().isAfter(verificationCode.getExpiresAt())) {
            throw new Exception("OTP expired");
        }
        if (normalizedOtp == null || normalizedOtp.length() != 6 || !normalizedOtp.chars().allMatch(Character::isDigit)) {
            throw new Exception("Invalid OTP");
        }
        if (!verificationCode.getOtp().equals(normalizedOtp)) {
            throw new Exception("Invalid OTP");
        }
        if (userRepository.findByEmail(normalizedNewEmail).isPresent()) {
            throw new Exception("Email already in use");
        }

        verificationCode.setConsumed(true);
        verificationCodeRepository.save(verificationCode);

        user.setEmail(normalizedNewEmail);
        userService.saveUser(user);
        verificationCodeRepository.delete(verificationCode);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                normalizedNewEmail,
                null,
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
        String refreshedJwt = jwtProvider.generateToken(authentication, loginSessionService.currentSessionId());
        authCookieService.writeAuthCookie(httpResponse, refreshedJwt);

        AuthResponse response = new AuthResponse();
        response.setJwt(refreshedJwt);
        response.setRole(user.getRole());
        response.setMessage("Email updated successfully.");
        return ResponseEntity.ok(response);
    }

    private UserProfileResponse toUserProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setMobileNumber(user.getMobileNumber());
        response.setRole(user.getRole());
        response.setAccountStatus(
                user.getAccountStatus() == null ? AccountStatus.ACTIVE : user.getAccountStatus()
        );
        LoginHistorySummaryResponse loginHistory = loginSessionService.getLoginHistory(user.getEmail(), user.getRole());
        response.setActiveDeviceCount(loginHistory.getActiveDeviceCount());
        response.setLoginHistory(loginHistory.getLoginHistory());

        List<UserAddressResponse> addresses = user.getAddresses().stream().map(address -> {
            UserAddressResponse addressResponse = new UserAddressResponse();
            addressResponse.setId(address.getId());
            addressResponse.setName(address.getName());
            addressResponse.setStreet(address.getStreet());
            addressResponse.setLocality(address.getLocality());
            addressResponse.setAddress(address.getAddress());
            addressResponse.setCity(address.getCity());
            addressResponse.setState(address.getState());
            addressResponse.setPinCode(address.getPinCode());
            addressResponse.setMobileNumber(address.getMobileNumber());
            return addressResponse;
        }).toList();

        response.setAddresses(addresses);
        return response;
    }

    private Address toAddress(UserAddressRequest request) {
        Address address = new Address();
        address.setName(request.getName());
        address.setStreet(request.getStreet());
        address.setLocality(request.getLocality());
        address.setAddress(request.getAddress());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPinCode(request.getPinCode());
        address.setMobileNumber(request.getMobileNumber());
        return address;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeOtp(String otp) {
        return otp == null ? null : otp.trim();
    }
}









