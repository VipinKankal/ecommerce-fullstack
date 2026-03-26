package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.order.service.impl.OrderTaxSnapshotServiceImpl;
import com.example.ecommerce.repository.OrderTaxSnapshotRepository;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.service.TaxComputationSupport;
import com.example.ecommerce.tax.service.TaxRuleVersionService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderTaxSnapshotServiceSmokeTest {

    @Test
    void freezeSnapshotCreatesImmutableAggregate() {
        OrderTaxSnapshotRepository repository = mock(OrderTaxSnapshotRepository.class);
        TaxRuleVersionService taxRuleVersionService = mock(TaxRuleVersionService.class);
        TaxComputationSupport taxComputationSupport = new TaxComputationSupport(taxRuleVersionService);
        OrderTaxSnapshotServiceImpl service =
                new OrderTaxSnapshotServiceImpl(repository, taxComputationSupport, new ObjectMapper());

        Seller seller = new Seller();
        seller.setGSTIN("07ABCDE1234F1Z5");

        Product product = new Product();
        product.setId(11L);
        product.setTitle("Blue Shirt");
        product.setSeller(seller);
        product.setPricingMode("INCLUSIVE");
        product.setTaxClass("APPAREL_STANDARD");
        product.setTaxRuleVersion("AUTO_ACTIVE");
        product.setPlatformCommission(100.0);
        product.setHsnCode("6205");

        OrderItem orderItem = new OrderItem();
        orderItem.setId(101L);
        orderItem.setProduct(product);
        orderItem.setQuantity(1);
        orderItem.setSellingPrice(1120);

        Address address = new Address();
        address.setState("Maharashtra");

        Order order = new Order();
        order.setId(55L);
        order.setShippingAddress(address);
        order.setOrderDate(LocalDateTime.of(2026, 3, 25, 10, 30));
        order.setTotalSellingPrice(1120);

        TaxRuleResolutionResponse gstRule = new TaxRuleResolutionResponse();
        gstRule.setRuleCode("APPAREL_GST_V2023_0401_HIGH");
        gstRule.setAppliedRatePercentage(12.0);
        gstRule.setValueBasis("SELLING_PRICE_PER_PIECE");

        TaxRuleResolutionResponse tcsRule = new TaxRuleResolutionResponse();
        tcsRule.setRuleCode("TCS_IGST_V2024_0710");
        tcsRule.setAppliedRatePercentage(0.5);
        tcsRule.setTaxAmount(5.0);

        when(repository.findByOrderId(55L)).thenReturn(Optional.empty());
        when(taxRuleVersionService.resolveRule(any())).thenReturn(gstRule, tcsRule);
        when(repository.save(any(OrderTaxSnapshot.class))).thenAnswer(invocation -> {
            OrderTaxSnapshot snapshot = invocation.getArgument(0);
            snapshot.setId(500L);
            return snapshot;
        });

        OrderTaxSnapshot snapshot = service.freezeSnapshot(order, List.of(orderItem), 0);

        assertEquals(500L, snapshot.getId());
        assertEquals("INTER_STATE", snapshot.getSupplyType());
        assertEquals(1000.0, snapshot.getTotalTaxableValue());
        assertEquals(120.0, snapshot.getTotalGstAmount());
        assertEquals(5.0, snapshot.getTcsAmount());
        assertEquals(snapshot, order.getOrderTaxSnapshot());
    }

    @Test
    void freezeSnapshotRejectsOverwriteAttempt() {
        OrderTaxSnapshotRepository repository = mock(OrderTaxSnapshotRepository.class);
        TaxRuleVersionService taxRuleVersionService = mock(TaxRuleVersionService.class);
        TaxComputationSupport taxComputationSupport = new TaxComputationSupport(taxRuleVersionService);
        OrderTaxSnapshotServiceImpl service =
                new OrderTaxSnapshotServiceImpl(repository, taxComputationSupport, new ObjectMapper());

        Order order = new Order();
        order.setId(77L);

        when(repository.findByOrderId(77L)).thenReturn(Optional.of(new OrderTaxSnapshot()));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.freezeSnapshot(order, List.of(new OrderItem()), 0)
        );

        assertEquals("Order tax snapshot already frozen", ex.getMessage());
    }

    @Test
    void freezeSnapshotRejectsWhenNoEffectiveGstRuleExists() {
        OrderTaxSnapshotRepository repository = mock(OrderTaxSnapshotRepository.class);
        TaxRuleVersionService taxRuleVersionService = mock(TaxRuleVersionService.class);
        TaxComputationSupport taxComputationSupport = new TaxComputationSupport(taxRuleVersionService);
        OrderTaxSnapshotServiceImpl service =
                new OrderTaxSnapshotServiceImpl(repository, taxComputationSupport, new ObjectMapper());

        Seller seller = new Seller();
        seller.setGSTIN("07ABCDE1234F1Z5");

        Product product = new Product();
        product.setId(12L);
        product.setTitle("Black T-Shirt");
        product.setSeller(seller);
        product.setPricingMode("INCLUSIVE");
        product.setTaxClass("APPAREL_STANDARD");
        product.setHsnCode("6109");

        OrderItem orderItem = new OrderItem();
        orderItem.setId(202L);
        orderItem.setProduct(product);
        orderItem.setQuantity(1);
        orderItem.setSellingPrice(999);

        Address address = new Address();
        address.setState("Delhi");

        Order order = new Order();
        order.setId(88L);
        order.setShippingAddress(address);
        order.setOrderDate(LocalDateTime.of(2026, 3, 25, 11, 15));
        order.setTotalSellingPrice(999);

        when(repository.findByOrderId(88L)).thenReturn(Optional.empty());
        when(taxRuleVersionService.resolveRule(any())).thenThrow(
                new IllegalArgumentException("No published tax rule available for the provided criteria")
        );

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.freezeSnapshot(order, List.of(orderItem), 0)
        );

        assertEquals("No effective GST rule found for order item 202", ex.getMessage());
    }

    @Test
    void freezeSnapshotRejectsFutureOrderDate() {
        OrderTaxSnapshotRepository repository = mock(OrderTaxSnapshotRepository.class);
        TaxRuleVersionService taxRuleVersionService = mock(TaxRuleVersionService.class);
        TaxComputationSupport taxComputationSupport = new TaxComputationSupport(taxRuleVersionService);
        OrderTaxSnapshotServiceImpl service =
                new OrderTaxSnapshotServiceImpl(repository, taxComputationSupport, new ObjectMapper());

        Order order = new Order();
        order.setId(99L);
        order.setOrderDate(LocalDateTime.now().plusDays(1));

        OrderItem orderItem = new OrderItem();
        orderItem.setId(303L);
        orderItem.setProduct(new Product());
        orderItem.setQuantity(1);
        orderItem.setSellingPrice(1000);

        when(repository.findByOrderId(99L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.freezeSnapshot(order, List.of(orderItem), 0)
        );

        assertEquals("Order date cannot be in the future for tax snapshot freeze", ex.getMessage());
    }
}

