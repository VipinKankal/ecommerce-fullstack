package com.example.ecommerce.seller.service;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.exceptions.SellerException;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.seller.request.SellerSignupRequest;
import com.example.ecommerce.seller.request.SellerUpdateRequest;

import java.util.List;

public interface SellerService {
    Seller getSellerProfile(String jwt) throws Exception;
    Seller createSeller(SellerSignupRequest request) throws Exception;
    Seller getSellerById(Long id) throws SellerException;
    Seller getSellerByEmail(String email) throws Exception;
    List<Seller> getAllSellers(AccountStatus status);
    Seller updateSeller(Long id, SellerUpdateRequest request) throws Exception;
    void deleteSeller(Long id) throws Exception;
    Seller verifyEmail(String email,String otp) throws Exception;
    Seller updateSellerAccountStatus(Long sellerId,AccountStatus status) throws Exception;
}




