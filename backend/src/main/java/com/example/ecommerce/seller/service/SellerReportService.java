package com.example.ecommerce.seller.service;

import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.SellerReport;

public interface SellerReportService {
    SellerReport getSellerReport(Seller seller);
    SellerReport updateSellerReport(SellerReport sellerReport);
}




