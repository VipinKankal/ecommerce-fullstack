package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.TaxRuleVersion;
import com.example.ecommerce.repository.TaxRuleVersionRepository;
import com.example.ecommerce.tax.request.CreateTaxRuleVersionRequest;
import com.example.ecommerce.tax.request.ResolveTaxRuleRequest;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.response.TaxRuleVersionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxRuleVersionServiceImplTest {

    @Mock
    private TaxRuleVersionRepository taxRuleVersionRepository;

    @InjectMocks
    private TaxRuleVersionServiceImpl taxRuleVersionService;

    @Test
    void createRuleRejectsDuplicateRuleCode() {
        CreateTaxRuleVersionRequest request = new CreateTaxRuleVersionRequest();
        request.setRuleCode("APPAREL_GST_V2026_0101");
        request.setRuleType("GST");
        request.setRatePercentage(5.0);
        request.setEffectiveFrom(LocalDate.of(2026, 1, 1));

        TaxRuleVersion existing = new TaxRuleVersion();
        existing.setId(1L);
        when(taxRuleVersionRepository.findByRuleCodeIgnoreCase("APPAREL_GST_V2026_0101"))
                .thenReturn(Optional.of(existing));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> taxRuleVersionService.createRule(request)
        );

        assertEquals("Tax rule code already exists", ex.getMessage());
    }

    @Test
    void createRuleCreatesDraftRule() {
        CreateTaxRuleVersionRequest request = new CreateTaxRuleVersionRequest();
        request.setRuleCode("apparel_gst_v2026_0101");
        request.setRuleType("gst");
        request.setTaxClass("apparel_standard");
        request.setMinTaxableValue(0.0);
        request.setMaxTaxableValue(2000.0);
        request.setRatePercentage(5.0);
        request.setEffectiveFrom(LocalDate.of(2026, 1, 1));

        when(taxRuleVersionRepository.findByRuleCodeIgnoreCase("APPAREL_GST_V2026_0101"))
                .thenReturn(Optional.empty());
        when(taxRuleVersionRepository.save(any(TaxRuleVersion.class))).thenAnswer(invocation -> {
            TaxRuleVersion rule = invocation.getArgument(0);
            rule.setId(10L);
            return rule;
        });

        TaxRuleVersionResponse response = taxRuleVersionService.createRule(request);

        assertEquals(10L, response.getId());
        assertEquals("APPAREL_GST_V2026_0101", response.getRuleCode());
        assertEquals("GST", response.getRuleType());
        assertEquals("APPAREL_STANDARD", response.getTaxClass());
        assertEquals(false, response.isPublished());
    }

    @Test
    void resolveRulePicksMostSpecificEffectiveRule() {
        TaxRuleVersion genericRule = new TaxRuleVersion();
        genericRule.setId(2L);
        genericRule.setRuleCode("GST_GENERIC");
        genericRule.setRuleType("GST");
        genericRule.setTaxClass("ANY");
        genericRule.setRatePercentage(12.0);
        genericRule.setPublished(true);
        genericRule.setEffectiveFrom(LocalDate.of(2025, 1, 1));

        TaxRuleVersion specificRule = new TaxRuleVersion();
        specificRule.setId(3L);
        specificRule.setRuleCode("GST_APPAREL_SPECIFIC");
        specificRule.setRuleType("GST");
        specificRule.setTaxClass("APPAREL_STANDARD");
        specificRule.setMinTaxableValue(0.0);
        specificRule.setMaxTaxableValue(2500.0);
        specificRule.setRatePercentage(5.0);
        specificRule.setPublished(true);
        specificRule.setEffectiveFrom(LocalDate.of(2025, 9, 22));

        when(taxRuleVersionRepository.findByRuleTypeIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(
                "GST",
                LocalDate.of(2026, 3, 25)
        )).thenReturn(List.of(genericRule, specificRule));

        ResolveTaxRuleRequest request = new ResolveTaxRuleRequest();
        request.setRuleType("GST");
        request.setTaxClass("APPAREL_STANDARD");
        request.setTaxableValue(1120.0);
        request.setEffectiveDate(LocalDate.of(2026, 3, 25));

        TaxRuleResolutionResponse response = taxRuleVersionService.resolveRule(request);

        assertEquals("GST_APPAREL_SPECIFIC", response.getRuleCode());
        assertEquals(5.0, response.getAppliedRatePercentage());
        assertEquals(56.0, response.getTaxAmount());
    }

    @Test
    void resolveRuleRejectsWhenNoPublishedRuleMatches() {
        when(taxRuleVersionRepository.findByRuleTypeIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(
                "GST",
                LocalDate.of(2026, 3, 25)
        )).thenReturn(List.of());

        ResolveTaxRuleRequest request = new ResolveTaxRuleRequest();
        request.setRuleType("GST");
        request.setTaxClass("APPAREL_STANDARD");
        request.setTaxableValue(500.0);
        request.setEffectiveDate(LocalDate.of(2026, 3, 25));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> taxRuleVersionService.resolveRule(request)
        );

        assertEquals("No published tax rule available for the provided criteria", ex.getMessage());
    }
}
