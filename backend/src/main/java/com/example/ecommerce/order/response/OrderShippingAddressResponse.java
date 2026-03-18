package com.example.ecommerce.order.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderShippingAddressResponse {
    private String name;
    private String street;
    private String locality;
    private String address;
    private String city;
    private String state;
    private String pinCode;
    private String mobileNumber;
}




