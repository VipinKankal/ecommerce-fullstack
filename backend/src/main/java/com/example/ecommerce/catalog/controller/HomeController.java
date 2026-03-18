package com.example.ecommerce.catalog.controller;

import com.example.ecommerce.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping
    public ApiResponse HomeControllerHandlerApiResponse(){
        ApiResponse response = new ApiResponse();
        response.setMessage("Welcome to E-Commerce Application");
        return response;
    }

}



