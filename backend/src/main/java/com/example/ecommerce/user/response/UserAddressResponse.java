package com.example.ecommerce.user.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAddressResponse {
    private Long id;
    private String name;
    private String street;
    private String locality;
    private String address;
    private String city;
    private String state;
    private String pinCode;
    private String mobileNumber;
}




