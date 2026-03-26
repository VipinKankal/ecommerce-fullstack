package com.example.ecommerce.tax.service;

import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.tax.request.ProductTaxPreviewRequest;
import com.example.ecommerce.tax.response.SellerProductTaxPreviewResponse;

public interface SellerProductTaxPreviewService {
    SellerProductTaxPreviewResponse preview(Seller seller, ProductTaxPreviewRequest request);
}
