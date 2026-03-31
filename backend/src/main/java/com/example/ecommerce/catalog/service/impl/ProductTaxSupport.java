package com.example.ecommerce.catalog.service.impl;

import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.tax.request.ProductTaxPreviewRequest;
import com.example.ecommerce.tax.response.SellerProductTaxPreviewResponse;

final class ProductTaxSupport {

    private ProductTaxSupport() {
    }

    static void applyResolvedTaxPreview(
            Product product,
            CreateProductRequest request,
            SellerProductTaxPreviewResponse taxPreview
    ) {
        product.setUiCategoryKey(resolveUiCategoryKey(
                request.getUiCategoryKey(),
                request.getCategory3(),
                request.getCategory2(),
                request.getCategory()
        ));
        product.setSubcategoryKey(resolveUiCategoryKey(
                request.getSubcategoryKey(),
                request.getCategory2(),
                request.getCategory(),
                null
        ));
        product.setGender(ProductValueSupport.normalizeNullable(request.getGender()));
        product.setFabricType(ProductValueSupport.normalizeNullable(request.getFabricType()));
        product.setConstructionType(ProductValueSupport.normalizeNullable(request.getConstructionType()));
        product.setFiberFamily(ProductValueSupport.normalizeNullable(request.getFiberFamily()));
        product.setHsnSelectionMode(ProductValueSupport.normalizeNullable(taxPreview.getHsnSelectionMode()));
        product.setSuggestedHsnCode(ProductValueSupport.normalizeNullable(taxPreview.getSuggestedHsnCode()));
        product.setOverrideRequestedHsnCode(
                ProductValueSupport.normalizeNullable(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()))
        );
        product.setHsnOverrideReason(ProductValueSupport.trimToNull(request.getHsnOverrideReason()));
        product.setHsnCode(ProductValueSupport.normalizeNullable(taxPreview.getResolvedHsnCode()));
        product.setTaxReviewStatus(resolveTaxReviewStatus(taxPreview));
        product.setPricingMode(ProductValueSupport.normalizePricingMode(request.getPricingMode()));
        product.setTaxClass(ProductValueSupport.normalizeTaxClass(taxPreview.getTaxClass()));
        product.setTaxRuleVersion(ProductValueSupport.normalizeTaxRuleVersion(
                taxPreview.getGstRuleCode() == null ? request.getTaxRuleVersion() : taxPreview.getGstRuleCode()
        ));
        product.setTaxPercentage(ProductValueSupport.normalizeCurrencyValue(taxPreview.getGstRatePreview(), 0.0));
        product.setActive(shouldBeActive(taxPreview));
    }

    static void applyResolvedTaxPreview(
            Product product,
            UpdateProductRequest request,
            SellerProductTaxPreviewResponse taxPreview
    ) {
        product.setUiCategoryKey(ProductValueSupport.normalizeCategoryKey(
                ProductValueSupport.firstNonBlank(request.getUiCategoryKey(), product.getUiCategoryKey())
        ));
        product.setSubcategoryKey(ProductValueSupport.normalizeCategoryKey(
                ProductValueSupport.firstNonBlank(request.getSubcategoryKey(), product.getSubcategoryKey())
        ));
        product.setGender(request.getGender() == null ? product.getGender() : ProductValueSupport.normalizeNullable(request.getGender()));
        product.setFabricType(request.getFabricType() == null ? product.getFabricType() : ProductValueSupport.normalizeNullable(request.getFabricType()));
        product.setConstructionType(
                request.getConstructionType() == null ? product.getConstructionType() : ProductValueSupport.normalizeNullable(request.getConstructionType())
        );
        product.setFiberFamily(request.getFiberFamily() == null ? product.getFiberFamily() : ProductValueSupport.normalizeNullable(request.getFiberFamily()));
        product.setHsnSelectionMode(ProductValueSupport.normalizeNullable(taxPreview.getHsnSelectionMode()));
        product.setSuggestedHsnCode(ProductValueSupport.normalizeNullable(taxPreview.getSuggestedHsnCode()));
        product.setOverrideRequestedHsnCode(
                ProductValueSupport.normalizeNullable(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()))
        );
        if (request.getHsnOverrideReason() != null) {
            product.setHsnOverrideReason(ProductValueSupport.trimToNull(request.getHsnOverrideReason()));
        }
        product.setHsnCode(ProductValueSupport.normalizeNullable(taxPreview.getResolvedHsnCode()));
        product.setTaxReviewStatus(resolveTaxReviewStatus(taxPreview));
        product.setTaxClass(ProductValueSupport.normalizeTaxClass(taxPreview.getTaxClass()));
        product.setTaxRuleVersion(ProductValueSupport.normalizeTaxRuleVersion(
                taxPreview.getGstRuleCode() == null
                        ? ProductValueSupport.firstNonBlank(request.getTaxRuleVersion(), product.getTaxRuleVersion())
                        : taxPreview.getGstRuleCode()
        ));
        product.setTaxPercentage(ProductValueSupport.normalizeCurrencyValue(taxPreview.getGstRatePreview(), 0.0));
        product.setActive(shouldBeActive(taxPreview));
    }

    static ProductTaxPreviewRequest buildTaxPreviewRequest(CreateProductRequest request) {
        ProductTaxPreviewRequest previewRequest = new ProductTaxPreviewRequest();
        previewRequest.setUiCategoryKey(resolveUiCategoryKey(
                request.getUiCategoryKey(),
                request.getCategory3(),
                request.getCategory2(),
                request.getCategory()
        ));
        previewRequest.setSubcategoryKey(resolveUiCategoryKey(
                request.getSubcategoryKey(),
                request.getCategory2(),
                request.getCategory(),
                null
        ));
        previewRequest.setGender(request.getGender());
        previewRequest.setFabricType(request.getFabricType());
        previewRequest.setConstructionType(request.getConstructionType());
        previewRequest.setFiberFamily(request.getFiberFamily());
        previewRequest.setHsnSelectionMode(request.getHsnSelectionMode());
        previewRequest.setOverrideRequestedHsnCode(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()));
        previewRequest.setHsnOverrideReason(request.getHsnOverrideReason());
        previewRequest.setPricingMode(request.getPricingMode());
        previewRequest.setTaxClass(request.getTaxClass());
        previewRequest.setTaxRuleVersion(request.getTaxRuleVersion());
        previewRequest.setSellingPricePerPiece((double) request.getSellingPrice());
        previewRequest.setCostPrice(request.getCostPrice());
        previewRequest.setPlatformCommission(request.getPlatformCommission());
        return previewRequest;
    }

    static ProductTaxPreviewRequest buildTaxPreviewRequest(UpdateProductRequest request, Product product) {
        ProductTaxPreviewRequest previewRequest = new ProductTaxPreviewRequest();
        previewRequest.setUiCategoryKey(ProductValueSupport.firstNonBlank(request.getUiCategoryKey(), product.getUiCategoryKey()));
        previewRequest.setSubcategoryKey(ProductValueSupport.firstNonBlank(request.getSubcategoryKey(), product.getSubcategoryKey()));
        previewRequest.setGender(ProductValueSupport.firstNonBlank(request.getGender(), product.getGender()));
        previewRequest.setFabricType(ProductValueSupport.firstNonBlank(request.getFabricType(), product.getFabricType()));
        previewRequest.setConstructionType(ProductValueSupport.firstNonBlank(request.getConstructionType(), product.getConstructionType()));
        previewRequest.setFiberFamily(ProductValueSupport.firstNonBlank(request.getFiberFamily(), product.getFiberFamily()));
        previewRequest.setHsnSelectionMode(ProductValueSupport.firstNonBlank(request.getHsnSelectionMode(), product.getHsnSelectionMode()));
        previewRequest.setOverrideRequestedHsnCode(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()));
        previewRequest.setHsnOverrideReason(
                request.getHsnOverrideReason() == null ? product.getHsnOverrideReason() : request.getHsnOverrideReason()
        );
        previewRequest.setPricingMode(ProductValueSupport.firstNonBlank(request.getPricingMode(), product.getPricingMode()));
        previewRequest.setTaxClass(ProductValueSupport.firstNonBlank(request.getTaxClass(), product.getTaxClass()));
        previewRequest.setTaxRuleVersion(ProductValueSupport.firstNonBlank(request.getTaxRuleVersion(), product.getTaxRuleVersion()));
        previewRequest.setSellingPricePerPiece(
                (double) (request.getSellingPrice() == null ? product.getSellingPrice() : request.getSellingPrice())
        );
        previewRequest.setCostPrice(request.getCostPrice() == null ? product.getCostPrice() : request.getCostPrice());
        previewRequest.setPlatformCommission(
                request.getPlatformCommission() == null ? product.getPlatformCommission() : request.getPlatformCommission()
        );
        return previewRequest;
    }

    static String resolveTaxReviewStatus(SellerProductTaxPreviewResponse taxPreview) {
        if (!Boolean.TRUE.equals(taxPreview.getSellerTaxEligible())) {
            return "SELLER_INELIGIBLE";
        }
        if (Boolean.TRUE.equals(taxPreview.getRequiresFiberSelection())) {
            return "FIBER_SELECTION_REQUIRED";
        }
        return taxPreview.getReviewStatus() == null ? "NOT_REQUIRED" : taxPreview.getReviewStatus();
    }

    static boolean shouldBeActive(SellerProductTaxPreviewResponse taxPreview) {
        return Boolean.TRUE.equals(taxPreview.getSellerTaxEligible())
                && !Boolean.TRUE.equals(taxPreview.getRequiresFiberSelection())
                && !Boolean.TRUE.equals(taxPreview.getRequiresReview())
                && taxPreview.getGstRuleCode() != null
                && !taxPreview.getGstRuleCode().isBlank();
    }

    private static String resolveUiCategoryKey(String first, String second, String third, String fourth) {
        return ProductValueSupport.normalizeCategoryKey(ProductValueSupport.firstNonBlank(first, second, third, fourth));
    }

    private static String resolveOverrideHsn(String requestedOverrideHsnCode, String fallbackHsnCode) {
        return ProductValueSupport.normalizeNullable(ProductValueSupport.firstNonBlank(requestedOverrideHsnCode, fallbackHsnCode));
    }
}
