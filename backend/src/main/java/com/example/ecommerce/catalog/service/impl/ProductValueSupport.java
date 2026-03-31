package com.example.ecommerce.catalog.service.impl;

import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;

import java.util.ArrayList;
import java.util.List;

final class ProductValueSupport {

    private ProductValueSupport() {
    }

    static int calculateDiscountPercentage(int mrpPrice, int sellingPrice) {
        if (mrpPrice <= 0) {
            throw new IllegalArgumentException("MRP price must be greater than zero");
        }
        double discount = mrpPrice - sellingPrice;
        double discountPercentage = (discount / mrpPrice) * 100;
        return (int) discountPercentage;
    }

    static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    static String normalizeWarrantyType(String value) {
        if (value == null || value.isBlank()) {
            return "NONE";
        }
        String normalized = value.trim().toUpperCase();
        if ("MANUFACTURER".equals(normalized)) {
            return "BRAND";
        }
        if (!List.of("NONE", "BRAND", "SELLER").contains(normalized)) {
            return "NONE";
        }
        return normalized;
    }

    static Integer normalizeWarrantyDays(String warrantyType, Integer warrantyDays) {
        if ("NONE".equalsIgnoreCase(normalizeWarrantyType(warrantyType))) {
            return 0;
        }
        if (warrantyDays == null) {
            return 0;
        }
        return Math.max(warrantyDays, 0);
    }

    static String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return "INCLUSIVE";
        }
        String normalized = pricingMode.trim().toUpperCase();
        return List.of("INCLUSIVE", "EXCLUSIVE").contains(normalized) ? normalized : "INCLUSIVE";
    }

    static String normalizeTaxClass(String taxClass) {
        if (taxClass == null || taxClass.isBlank()) {
            return "APPAREL_STANDARD";
        }
        return taxClass.trim().toUpperCase();
    }

    static String normalizeTaxRuleVersion(String taxRuleVersion) {
        if (taxRuleVersion == null || taxRuleVersion.isBlank()) {
            return "AUTO_ACTIVE";
        }
        return taxRuleVersion.trim().toUpperCase();
    }

    static String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "INR";
        }
        return currency.trim().toUpperCase();
    }

    static Double normalizeCurrencyValue(Number value, double fallback) {
        if (value == null) {
            return fallback;
        }
        return Math.max(value.doubleValue(), 0.0);
    }

    static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    static String normalizeCategoryKey(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    static List<ProductVariant> buildVariants(
            List<CreateProductRequest.VariantRequest> variants,
            Product product
    ) {
        if (variants == null || variants.isEmpty()) {
            return new ArrayList<>();
        }

        return variants.stream()
                .filter(variant -> variant != null)
                .map(variant -> {
                    ProductVariant productVariant = new ProductVariant();
                    productVariant.setProduct(product);
                    productVariant.setVariantType(variant.getVariantType());
                    productVariant.setVariantValue(variant.getVariantValue());
                    productVariant.setSize(variant.getSize() == null ? null : variant.getSize().trim());
                    productVariant.setColor(variant.getColor() == null ? null : variant.getColor().trim());
                    productVariant.setSku(variant.getSku() == null ? null : variant.getSku().trim());
                    productVariant.setPrice(variant.getPrice());
                    int initialSellerStock = Math.max(variant.getQuantity() == null ? 0 : variant.getQuantity(), 0);
                    productVariant.setSellerStock(initialSellerStock);
                    productVariant.setWarehouseStock(0);
                    return productVariant;
                })
                .toList();
    }

    static void initializeCollections(Product product) {
        if (product != null && product.getImages() != null) {
            product.getImages().size();
        }
        if (product != null && product.getVariants() != null) {
            product.getVariants().size();
        }
    }
}
