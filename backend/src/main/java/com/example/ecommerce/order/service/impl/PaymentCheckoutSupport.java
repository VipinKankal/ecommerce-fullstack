package com.example.ecommerce.order.service.impl;

import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.example.ecommerce.modal.User;
import org.json.JSONObject;

final class PaymentCheckoutSupport {

    private PaymentCheckoutSupport() {
    }

    static PaymentLink createRazorpayPaymentLink(User user, Long amount, Long orderId, String apiKey, String apiSecret, String frontendBaseUrl) throws RazorpayException {
        if (!PaymentGatewaySupport.isRazorpayConfigured(apiKey, apiSecret)) {
            throw new IllegalArgumentException("Razorpay is not configured. Set RAZORPAY_API_KEY and RAZORPAY_API_SECRET.");
        }
        long normalizedAmount = amount * 100;
        try {
            RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);
            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", normalizedAmount);
            paymentLinkRequest.put("currency", "INR");

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("email", true);
            paymentLinkRequest.put("notify", notify);
            paymentLinkRequest.put("callback_url", PaymentGatewaySupport.buildUrl(frontendBaseUrl, "http://localhost:3000", "/payment-success/" + orderId));
            paymentLinkRequest.put("callback_method", "get");

            return razorpay.paymentLink.create(paymentLinkRequest);
        } catch (Exception e) {
            throw new RazorpayException(e.getMessage());
        }
    }

    static String createStripePaymentLink(User user, Long amount, Long orderId, String stripeSecretKey, String frontendBaseUrl) throws StripeException {
        if (!PaymentGatewaySupport.isStripeConfigured(stripeSecretKey)) {
            throw new IllegalArgumentException("Stripe is not configured. Set STRIPE_SECRET_KEY.");
        }
        Stripe.apiKey = stripeSecretKey;
        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(PaymentGatewaySupport.buildUrl(frontendBaseUrl, "http://localhost:3000", "/payment-success/" + orderId))
                .setCancelUrl(PaymentGatewaySupport.buildUrl(frontendBaseUrl, "http://localhost:3000", "/payment-cancel"))
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(amount * 100)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Vipin e comm paymet" + orderId)
                                        .build())
                                .build())
                        .build())
                .build();

        Session session = Session.create(params);
        return session.getUrl();
    }
}
