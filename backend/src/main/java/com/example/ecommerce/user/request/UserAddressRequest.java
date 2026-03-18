package com.example.ecommerce.user.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAddressRequest {

    @NotBlank(message = "name is required")
    private String name;

    private String street;
    private String locality;

    @NotBlank(message = "address is required")
    private String address;

    @NotBlank(message = "city is required")
    private String city;

    @NotBlank(message = "state is required")
    private String state;

    @NotBlank(message = "pinCode is required")
    private String pinCode;

    @NotBlank(message = "mobileNumber is required")
    private String mobileNumber;
}




