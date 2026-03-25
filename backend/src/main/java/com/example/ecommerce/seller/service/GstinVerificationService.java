package com.example.ecommerce.seller.service;

public interface GstinVerificationService {
    String normalizeAndValidate(String gstin);

    void assertActive(String gstin);
}
