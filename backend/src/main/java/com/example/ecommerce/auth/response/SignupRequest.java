package com.example.ecommerce.auth.response;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;
    @NotBlank(message = "OTP is required")
    private String otp;
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}




