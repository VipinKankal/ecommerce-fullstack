package com.example.ecommerce.user.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserProfileRequest {

    @NotBlank(message = "fullName is required")
    private String fullName;

    private String mobileNumber;
}




