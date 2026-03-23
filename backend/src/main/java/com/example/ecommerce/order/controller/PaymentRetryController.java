package com.example.ecommerce.order.controller;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.common.domain.CouponReservationState;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.response.PaymentLinkResponse;
import com.example.ecommerce.order.response.PhonePePaymentSession;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentRetryController {

    private final PaymentService paymentService;
    private final CouponService couponService;
    private final PaymentOrderRepository paymentOrderRepository;
    private final UserService userService;

    @PostMapping("/retry/{paymentOrderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional
    public ResponseEntity<PaymentLinkResponse> retryPayment(
            @PathVariable Long paymentOrderId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        PaymentOrder paymentOrder = paymentService.getPaymentOrderById(paymentOrderId);
        if (paymentOrder.getUser() == null || !paymentOrder.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized payment retry access");
        }
        if (paymentOrder.getStatus() == PaymentOrderStatus.SUCCESS) {
            throw new IllegalArgumentException("Payment already successful");
        }

        return ResponseEntity.ok(buildRetryResponse(user, paymentOrder));
    }

    private PaymentLinkResponse buildRetryResponse(User user, PaymentOrder paymentOrder) throws Exception {
        Set<Order> orders = paymentOrder.getOrders();
        if (orders == null || orders.isEmpty()) {
            throw new IllegalArgumentException("Cannot retry payment without order context");
        }
        if (paymentOrder.getCouponReservationState() == CouponReservationState.RELEASED) {
            couponService.reserveCouponForOrders(
                    user,
                    orders,
                    "PAYMENT_RETRY:" + paymentOrder.getId()
            );
            paymentOrder.setCouponReservationState(CouponReservationState.RESERVED);
        }

        PaymentMethod paymentMethod;
        PaymentType paymentType;
        PaymentProvider provider;
        String paymentUrl;
        String paymentReference;

        if (paymentOrder.getProvider() == PaymentProvider.PHONEPE || paymentOrder.getPaymentMethod() == PaymentMethod.UPI) {
            paymentService.assertPhonePeConfigured();
            PhonePePaymentSession session = paymentService.createPhonePePaymentSession(user, paymentOrder);
            paymentMethod = PaymentMethod.UPI;
            paymentType = PaymentType.UPI;
            provider = PaymentProvider.PHONEPE;
            paymentUrl = session.getRedirectUrl();
            paymentReference = session.getMerchantTransactionId();
        } else {
            paymentMethod = PaymentMethod.CARD;
            paymentType = PaymentType.CARD;
            provider = PaymentProvider.STRIPE;
            paymentUrl = paymentService.createStripePaymentLink(user, paymentOrder.getAmount(), paymentOrder.getId());
            paymentOrder.setPaymentLinkId(String.valueOf(paymentOrder.getId()));
            paymentReference = String.valueOf(paymentOrder.getId());
        }

        paymentOrder.setStatus(PaymentOrderStatus.PENDING);
        paymentOrder.setPaymentMethod(paymentMethod);
        paymentOrder.setPaymentType(paymentType);
        paymentOrder.setProvider(provider);
        paymentOrder.setRetryCount((paymentOrder.getRetryCount() == null ? 0 : paymentOrder.getRetryCount()) + 1);
        paymentOrder.setLastRetryAt(LocalDateTime.now());
        paymentOrderRepository.save(paymentOrder);

        for (Order order : orders) {
            if (order.getPaymentStatus() == PaymentStatus.FAILED) {
                order.setPaymentStatus(PaymentStatus.PENDING);
            }
            if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                throw new IllegalArgumentException("Cancelled order cannot be retried");
            }
        }

        PaymentLinkResponse response = new PaymentLinkResponse();
        response.setOrderId(orders.size() == 1 ? orders.iterator().next().getId() : null);
        response.setPaymentOrderId(paymentOrder.getId());
        response.setPaymentMethod(paymentMethod);
        response.setPaymentType(paymentType);
        response.setProvider(provider);
        response.setPaymentStatus(PaymentStatus.PENDING);
        response.setOrderStatus(OrderStatus.INITIATED);
        response.setPayment_link_url(paymentUrl);
        response.setPayment_link_id(paymentReference);
        return response;
    }
}
