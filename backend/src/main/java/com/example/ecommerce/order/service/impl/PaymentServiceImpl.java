package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.example.ecommerce.order.service.PaymentService;
import com.razorpay.Payment;
import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentOrderRepository paymentOrderRepository;
    private final OrderRepository orderRepository;

    @Value("${payment.razorpay.api-key}")
    private String apiKey;

    @Value("${payment.razorpay.api-secret}")
    private String apiSecret;

    @Value("${payment.stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @PostConstruct
    void logPaymentConfigStatus() {
        log.info(
                "Payment config loaded: razorpayConfigured={}, razorpayKeyPrefix={}, razorpaySecretSuffix={}, stripeConfigured={}",
                isRazorpayConfigured(),
                maskPrefix(apiKey),
                maskSuffix(apiSecret),
                isStripeConfigured()
        );
    }

    @Override
    public PaymentOrder createOrder(User user, Set<Order> orders) {
        Long amount = orders.stream().mapToLong(Order::getTotalSellingPrice).sum();
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setAmount(amount);
        paymentOrder.setUser(user);
        paymentOrder.setOrders(orders);
        return paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public PaymentOrder getPaymentOrderById(Long orderId) throws Exception {
        return paymentOrderRepository.findById(orderId).orElseThrow(
                () -> new Exception("Payment Order not found"));
    }

    @Override
    public PaymentOrder getPaymentOrderByPaymentId(String orderId) throws Exception {
        PaymentOrder paymentOrder = paymentOrderRepository.findByPaymentLinkId(orderId);
        if (paymentOrder == null) {
            throw new Exception("Payment Order not found with provided payment link id: " + orderId);
        }
        return paymentOrder;
    }

    @Override
    public Boolean ProceedPaymentOrder(PaymentOrder paymentOrder, String paymentId, String paymentLinkId) throws RazorpayException {
        if (paymentOrder.getStatus().equals(PaymentOrderStatus.PENDING)) {
            if (paymentOrder.getPaymentLinkId() == null || !paymentOrder.getPaymentLinkId().equals(paymentLinkId)) {
                throw new RazorpayException("Invalid payment link reference");
            }

            RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);
            Payment payment = razorpay.payments.fetch(paymentId);
            String status = payment.get("status");

            if ("captured".equals(status)) {
                Set<Order> orders = paymentOrder.getOrders();
                for (Order order : orders) {
                    order.setPaymentStatus(PaymentStatus.COMPLETED);
                    orderRepository.save(order);
                }
                paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
                paymentOrderRepository.save(paymentOrder);
                return true;
            }

            paymentOrder.setStatus(PaymentOrderStatus.FAILED);
            paymentOrderRepository.save(paymentOrder);
            return false;
        }

        return false;
    }

    @Override
    public PaymentLink createRazorpayPaymentLink(User user, Long amount, Long orderId) throws RazorpayException {
        if (!isRazorpayConfigured()) {
            throw new IllegalArgumentException("Razorpay is not configured. Set RAZORPAY_API_KEY and RAZORPAY_API_SECRET.");
        }
        amount = amount * 100;
        try {
            RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);

            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amount);
            paymentLinkRequest.put("currency", "INR");

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("email", true);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("callback_url", buildFrontendUrl("/payment-success/" + orderId));
            paymentLinkRequest.put("callback_method", "get");

            return razorpay.paymentLink.create(paymentLinkRequest);

        } catch (Exception e) {
            throw new RazorpayException(e.getMessage());
        }
    }

    @Override
    public String createStripePaymentLink(User user, Long amount, Long orderId) throws StripeException {
        if (!isStripeConfigured()) {
            throw new IllegalArgumentException("Stripe is not configured. Set STRIPE_SECRET_KEY.");
        }
        Stripe.apiKey = stripeSecretKey;
        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(buildFrontendUrl("/payment-success/" + orderId))
                .setCancelUrl(buildFrontendUrl("/payment-cancel"))
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(amount * 100)
                                .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                .setName("Vipin e comm paymet" + orderId)
                                                .build()
                                )
                                .build()
                        )
                        .build()
                ).build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    private String buildFrontendUrl(String path) {
        String baseUrl = frontendBaseUrl == null ? "http://localhost:3000" : frontendBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return baseUrl + path;
    }

    private boolean isRazorpayConfigured() {
        return isMeaningfulSecret(apiKey) && isMeaningfulSecret(apiSecret)
                && !"api_key".equalsIgnoreCase(apiKey)
                && !"api_secret".equalsIgnoreCase(apiSecret);
    }

    private boolean isStripeConfigured() {
        return isMeaningfulSecret(stripeSecretKey)
                && !"stripe_secret_key".equalsIgnoreCase(stripeSecretKey);
    }

    private boolean isMeaningfulSecret(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String maskPrefix(String value) {
        if (!isMeaningfulSecret(value)) return "MISSING";
        String trimmed = value.trim();
        return trimmed.length() <= 8 ? trimmed : trimmed.substring(0, 8) + "...";
    }

    private String maskSuffix(String value) {
        if (!isMeaningfulSecret(value)) return "MISSING";
        String trimmed = value.trim();
        return trimmed.length() <= 4 ? "****" : "****" + trimmed.substring(trimmed.length() - 4);
    }
}






