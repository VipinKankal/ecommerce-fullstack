package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.order.response.CheckoutOrderSummaryResponse;

public interface CheckoutTaxSummaryService {
    CheckoutOrderSummaryResponse buildSummary(Cart cart, Address shippingAddress);
}
