package com.example.ecommerce.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyEmailChangeOtpRequest {

    @NotBlank(message = "newEmail is required")
    @Email(message = "newEmail must be valid")
    private String newEmail;

    @NotBlank(message = "otp is required")
    private String otp;
}




