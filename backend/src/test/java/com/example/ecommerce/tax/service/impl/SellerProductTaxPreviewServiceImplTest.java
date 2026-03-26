package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.HsnMasterRule;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.tax.request.ProductTaxPreviewRequest;
import com.example.ecommerce.tax.response.SellerProductTaxPreviewResponse;
import com.example.ecommerce.tax.service.HsnMasterService;
import com.example.ecommerce.tax.service.TaxComputationSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerProductTaxPreviewServiceImplTest {

    @Mock
    private HsnMasterService hsnMasterService;

    @Mock
    private TaxComputationSupport taxComputationSupport;

    @Test
    void previewRejectsFutureEffectiveDate() {
        SellerProductTaxPreviewServiceImpl service =
                new SellerProductTaxPreviewServiceImpl(hsnMasterService, taxComputationSupport);

        ProductTaxPreviewRequest request = new ProductTaxPreviewRequest();
        request.setUiCategoryKey("men_shirts");
        request.setConstructionType("woven");
        request.setEffectiveDate(LocalDate.now().plusDays(1));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.preview(new Seller(), request)
        );

        assertEquals("Effective date cannot be in the future for seller preview", ex.getMessage());
    }

    @Test
    void previewMarksReviewWhenNoEffectiveGstRuleIsResolved() {
        SellerProductTaxPreviewServiceImpl service =
                new SellerProductTaxPreviewServiceImpl(hsnMasterService, taxComputationSupport);

        ProductTaxPreviewRequest request = new ProductTaxPreviewRequest();
        request.setUiCategoryKey("men_tshirts");
        request.setConstructionType("knit");
        request.setSellingPricePerPiece(1200.0);
        request.setCostPrice(700.0);
        request.setPlatformCommission(100.0);
        request.setEffectiveDate(LocalDate.now());

        Seller seller = new Seller();
        seller.setGstComplianceStatus("ACTIVE_GSTIN");

        HsnMasterRule hsnRule = new HsnMasterRule();
        hsnRule.setDisplayLabel("Men T-Shirts");
        hsnRule.setMappingMode("DIRECT");
        hsnRule.setHsnCode("6109");
        hsnRule.setTaxClass("APPAREL_STANDARD");
        hsnRule.setHsnChapter("61");

        when(hsnMasterService.resolveSuggestion(any(), any(), any(), any(), any())).thenReturn(hsnRule);
        when(taxComputationSupport.resolveGstRule(any(), any(), any(), any(), any())).thenReturn(null);
        when(taxComputationSupport.computeAmounts(anyString(), anyDouble(), anyDouble()))
                .thenReturn(new TaxComputationSupport.TaxAmounts(1200.0, 0.0, 1200.0));
        when(taxComputationSupport.resolveTcsRule(any(), any(), any())).thenReturn(null);
        when(taxComputationSupport.roundCurrency(anyDouble())).thenAnswer(invocation -> invocation.getArgument(0));

        SellerProductTaxPreviewResponse response = service.preview(seller, request);

        assertTrue(Boolean.TRUE.equals(response.getRequiresReview()));
        assertEquals("PENDING_REVIEW", response.getReviewStatus());
        assertTrue(response.getGstRuleCode() == null);
        assertTrue(response.getNote().contains("No effective GST rule is active"));
    }
}
