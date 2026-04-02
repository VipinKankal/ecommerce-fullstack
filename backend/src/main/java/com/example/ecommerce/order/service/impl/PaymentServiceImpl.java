package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.response.PhonePePaymentSession;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.razorpay.Payment;
import com.razorpay.PaymentLink;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final String PHONEPE_PAY_PATH = "/pg/v1/pay";
    private static final String PHONEPE_STATUS_PATH_TEMPLATE = "/pg/v1/status/%s/%s";

    private final PaymentOrderRepository paymentOrderRepository;
    private final OrderRepository orderRepository;
    private final CouponService couponService;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${payment.razorpay.api-key}")
    private String apiKey;
    @Value("${payment.razorpay.api-secret}")
    private String apiSecret;
    @Value("${payment.stripe.secret-key}")
    private String stripeSecretKey;
    @Value("${payment.phonepe.base-url:}")
    private String phonePeBaseUrl;
    @Value("${payment.phonepe.merchant-id:}")
    private String phonePeMerchantId;
    @Value("${payment.phonepe.salt-key:}")
    private String phonePeSaltKey;
    @Value("${payment.phonepe.salt-index:}")
    private String phonePeSaltIndex;
    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;
    @Value("${app.backend.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    @PostConstruct
    void logPaymentConfigStatus() {
        log.info("Payment config loaded: phonePeConfigured={}, razorpayConfigured={}, razorpayKeyPrefix={}, razorpaySecretSuffix={}, stripeConfigured={}",
                PaymentGatewaySupport.isPhonePeConfigured(phonePeBaseUrl, phonePeMerchantId, phonePeSaltKey, phonePeSaltIndex),
                PaymentGatewaySupport.isRazorpayConfigured(apiKey, apiSecret),
                PaymentGatewaySupport.maskPrefix(apiKey),
                PaymentGatewaySupport.maskSuffix(apiSecret),
                PaymentGatewaySupport.isStripeConfigured(stripeSecretKey));
    }

    @Override
    public PaymentOrder createOrder(User user, Set<Order> orders, PaymentMethod paymentMethod, PaymentType paymentType, PaymentProvider provider) {
        Long amount = orders.stream().mapToLong(Order::getTotalSellingPrice).sum();
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setAmount(amount);
        paymentOrder.setUser(user);
        paymentOrder.setOrders(orders);
        paymentOrder.setPaymentMethod(paymentMethod);
        paymentOrder.setPaymentType(paymentType);
        paymentOrder.setProvider(provider);
        return paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public PaymentOrder getPaymentOrderById(Long orderId) throws Exception {
        return paymentOrderRepository.findById(orderId).orElseThrow(() -> new Exception("Payment Order not found"));
    }

    @Override
    public PaymentOrder getPaymentOrderByPaymentId(String orderId) throws Exception {
        PaymentOrder paymentOrder = paymentOrderRepository.findByPaymentLinkId(orderId);
        if (paymentOrder == null) throw new Exception("Payment Order not found with provided payment link id: " + orderId);
        return paymentOrder;
    }

    @Override
    public PaymentOrder getPaymentOrderByMerchantTransactionId(String merchantTransactionId) throws Exception {
        PaymentOrder paymentOrder = paymentOrderRepository.findByMerchantTransactionId(merchantTransactionId);
        if (paymentOrder == null) throw new Exception("Payment Order not found with provided merchant transaction id: " + merchantTransactionId);
        return paymentOrder;
    }

    @Override
    public Boolean ProceedPaymentOrder(PaymentOrder paymentOrder, String paymentId, String paymentLinkId) throws RazorpayException {
        if (paymentOrder.getStatus().equals(PaymentOrderStatus.PENDING)) {
            com.razorpay.RazorpayClient razorpay = new com.razorpay.RazorpayClient(apiKey, apiSecret);
            Payment payment = razorpay.payments.fetch(paymentId);
            boolean success = PaymentOrderStateSupport.markRazorpayPaymentResult(paymentOrder, paymentLinkId, payment.get("status"), orderRepository, couponService);
            paymentOrderRepository.save(paymentOrder);
            return success;
        }
        return false;
    }

    @Override
    public void assertPhonePeConfigured() {
        if (!PaymentGatewaySupport.isPhonePeConfigured(phonePeBaseUrl, phonePeMerchantId, phonePeSaltKey, phonePeSaltIndex)) {
            throw new IllegalArgumentException("PhonePe is not configured. Set PHONEPE_BASE_URL, PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY and PHONEPE_SALT_INDEX.");
        }
    }

    @Override
    public PhonePePaymentSession createPhonePePaymentSession(User user, PaymentOrder paymentOrder) throws Exception {
        assertPhonePeConfigured();
        String merchantTransactionId = PhonePeSupport.buildMerchantTransactionId(paymentOrder.getId());
        JSONObject payload = new JSONObject();
        payload.put("merchantId", phonePeMerchantId);
        payload.put("merchantTransactionId", merchantTransactionId);
        payload.put("merchantUserId", "USER-" + user.getId());
        payload.put("amount", paymentOrder.getAmount() * 100);
        payload.put("redirectUrl", PaymentGatewaySupport.buildUrl(frontendBaseUrl, "http://localhost:3000", "/payment-success/" + paymentOrder.getId() + "?provider=PHONEPE&merchantTransactionId=" + merchantTransactionId));
        payload.put("redirectMode", "REDIRECT");
        payload.put("callbackUrl", PaymentGatewaySupport.buildUrl(backendBaseUrl, "http://localhost:8080", "/api/payment/phonepe/webhook?merchantTransactionId=" + merchantTransactionId));

        JSONObject paymentInstrument = new JSONObject();
        paymentInstrument.put("type", "PAY_PAGE");
        payload.put("paymentInstrument", paymentInstrument);
        if (PaymentGatewaySupport.isMeaningfulSecret(user.getMobileNumber())) payload.put("mobileNumber", user.getMobileNumber().trim());

        String encodedRequest = PhonePeSupport.encodePayload(payload);
        JSONObject requestBody = new JSONObject();
        requestBody.put("request", encodedRequest);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(PaymentGatewaySupport.normalizeUrl(phonePeBaseUrl) + PHONEPE_PAY_PATH))
                .header("Content-Type", "application/json")
                .header("accept", "application/json")
                .header("X-VERIFY", PhonePeSupport.buildPayloadSignature(encodedRequest, PHONEPE_PAY_PATH, phonePeSaltKey, phonePeSaltIndex))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JSONObject parsed = PhonePeSupport.parsePhonePeResponse(response.body());
        String redirectUrl = PaymentGatewaySupport.firstNonBlank(
                PaymentGatewaySupport.extractNestedString(parsed, "data", "instrumentResponse", "redirectInfo", "url"),
                PaymentGatewaySupport.extractNestedString(parsed, "data", "redirectInfo", "url"),
                PaymentGatewaySupport.extractNestedString(parsed, "data", "instrumentResponse", "intentUrl"),
                PaymentGatewaySupport.extractNestedString(parsed, "data", "intentUrl")
        );
        if (!PaymentGatewaySupport.isMeaningfulSecret(redirectUrl)) {
            throw new IllegalArgumentException(PaymentGatewaySupport.firstNonBlank(PaymentGatewaySupport.extractNestedString(parsed, "message"), "PhonePe did not return a redirect URL."));
        }

        paymentOrder.setProvider(PaymentProvider.PHONEPE);
        paymentOrder.setPaymentMethod(PaymentMethod.UPI);
        paymentOrder.setPaymentType(PaymentType.UPI);
        paymentOrder.setMerchantTransactionId(merchantTransactionId);
        paymentOrder.setPaymentLinkId(merchantTransactionId);
        paymentOrderRepository.save(paymentOrder);
        return new PhonePePaymentSession(merchantTransactionId, redirectUrl);
    }

    @Override
    public PaymentOrder syncPhonePePaymentStatus(PaymentOrder paymentOrder) throws Exception {
        if (paymentOrder.getProvider() != PaymentProvider.PHONEPE) return paymentOrder;
        if (!PaymentGatewaySupport.isMeaningfulSecret(paymentOrder.getMerchantTransactionId())) throw new IllegalArgumentException("PhonePe merchant transaction id is missing");

        String path = PHONEPE_STATUS_PATH_TEMPLATE.formatted(phonePeMerchantId, paymentOrder.getMerchantTransactionId());
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(PaymentGatewaySupport.normalizeUrl(phonePeBaseUrl) + path))
                .header("accept", "application/json")
                .header("Content-Type", "application/json")
                .header("X-VERIFY", PhonePeSupport.buildStatusSignature(path, phonePeSaltKey, phonePeSaltIndex))
                .header("X-MERCHANT-ID", phonePeMerchantId)
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JSONObject parsed = PhonePeSupport.parsePhonePeResponse(response.body());
        PaymentOrderStateSupport.applyPhonePeStatus(paymentOrder, PhonePeSupport.resolvePhonePeStatus(parsed), orderRepository, couponService);
        return paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public PaymentLink createRazorpayPaymentLink(User user, Long amount, Long orderId) throws RazorpayException {
        return PaymentCheckoutSupport.createRazorpayPaymentLink(user, amount, orderId, apiKey, apiSecret, frontendBaseUrl);
    }

    @Override
    public String createStripePaymentLink(User user, Long amount, Long orderId) throws com.stripe.exception.StripeException {
        return PaymentCheckoutSupport.createStripePaymentLink(user, amount, orderId, stripeSecretKey, frontendBaseUrl);
    }
}
