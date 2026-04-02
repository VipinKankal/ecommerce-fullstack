package com.example.ecommerce.order.usecase;

import com.example.ecommerce.common.domain.CouponReservationState;
import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.CheckoutOrderRequest;
import com.example.ecommerce.order.request.CheckoutOrderSummaryRequest;
import com.example.ecommerce.order.response.CheckoutOrderSummaryResponse;
import com.example.ecommerce.order.response.PaymentLinkResponse;
import com.example.ecommerce.order.response.PhonePePaymentSession;
import com.example.ecommerce.order.service.CartService;
import com.example.ecommerce.order.service.CheckoutTaxSummaryService;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderCheckoutUseCase {

    private final OrderService orderService;
    private final UserService userService;
    private final CartService cartService;
    private final CheckoutTaxSummaryService checkoutTaxSummaryService;
    private final CouponService couponService;
    private final PaymentService paymentService;
    private final PaymentOrderRepository paymentOrderRepository;

    public PaymentLinkResponse createPaymentLink(Address shippingAddress, String paymentMethod, String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        PaymentMethod resolvedPaymentMethod = OrderCheckoutSupport.resolveCheckoutPaymentMethod(paymentMethod == null ? "" : paymentMethod.trim().toUpperCase());
        return resolvedPaymentMethod == PaymentMethod.COD
                ? createCashOnDeliveryResponse(user, shippingAddress)
                : createOnlinePaymentResponse(user, shippingAddress, resolvedPaymentMethod, null);
    }

    public PaymentLinkResponse createCheckoutOrder(CheckoutOrderRequest request, String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String normalizedPaymentMethod = request.getPaymentMethod() == null ? "" : request.getPaymentMethod().trim().toUpperCase();
        if ("COD".equals(normalizedPaymentMethod)) {
            return createCashOnDeliveryResponse(user, request.getShippingAddress());
        }

        String checkoutRequestId = OrderCheckoutSupport.normalizeCheckoutRequestId(request.getCheckoutRequestId());
        if (checkoutRequestId != null) {
            PaymentOrder previousAttempt = paymentOrderRepository.findTopByUserIdAndCheckoutRequestIdOrderByIdDesc(user.getId(), checkoutRequestId);
            if (previousAttempt != null && previousAttempt.getStatus() != PaymentOrderStatus.SUCCESS) {
                return retryExistingPaymentOrder(user, previousAttempt);
            }
        }

        return createOnlinePaymentResponse(user, request.getShippingAddress(), OrderCheckoutSupport.resolveCheckoutPaymentMethod(normalizedPaymentMethod), checkoutRequestId);
    }

    public CheckoutOrderSummaryResponse getCheckoutSummary(CheckoutOrderSummaryRequest request, String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Cart cart = requireCart(user);
        return checkoutTaxSummaryService.buildSummary(cart, request.getShippingAddress());
    }

    private Cart requireCart(User user) throws Exception {
        Cart cart = cartService.findUserCart(user);
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        return cart;
    }

    private PaymentLinkResponse createOnlinePaymentResponse(User user, Address shippingAddress, PaymentMethod paymentMethod, String checkoutRequestId) throws Exception {
        Cart cart = requireCart(user);
        couponService.validateAppliedCoupon(user, cart);
        String reservedCouponCode = couponService.reserveCouponForCheckout(user, cart, checkoutRequestId);
        try {
            if (paymentMethod == PaymentMethod.UPI) {
                paymentService.assertPhonePeConfigured();
                Set<Order> orders = orderService.createOrder(user, shippingAddress, cart, OrderStatus.INITIATED, PaymentStatus.PENDING, PaymentMethod.UPI, PaymentType.UPI, PaymentProvider.PHONEPE);
                PaymentOrder paymentOrder = paymentService.createOrder(user, orders, PaymentMethod.UPI, PaymentType.UPI, PaymentProvider.PHONEPE);
                paymentOrder.setCheckoutRequestId(checkoutRequestId);
                paymentOrder.setCouponReservationState(reservedCouponCode == null ? CouponReservationState.NONE : CouponReservationState.RESERVED);
                paymentOrderRepository.save(paymentOrder);
                PhonePePaymentSession session = paymentService.createPhonePePaymentSession(user, paymentOrder);
                return OrderCheckoutSupport.buildPaymentResponse(orders, paymentOrder.getId(), PaymentMethod.UPI, PaymentType.UPI, PaymentProvider.PHONEPE, PaymentStatus.PENDING, OrderStatus.INITIATED, session.getRedirectUrl(), session.getMerchantTransactionId());
            }

            Set<Order> orders = orderService.createOrder(user, shippingAddress, cart, OrderStatus.INITIATED, PaymentStatus.PENDING, PaymentMethod.CARD, PaymentType.CARD, PaymentProvider.STRIPE);
            PaymentOrder paymentOrder = paymentService.createOrder(user, orders, PaymentMethod.CARD, PaymentType.CARD, PaymentProvider.STRIPE);
            paymentOrder.setCheckoutRequestId(checkoutRequestId);
            paymentOrder.setCouponReservationState(reservedCouponCode == null ? CouponReservationState.NONE : CouponReservationState.RESERVED);
            String paymentUrl = paymentService.createStripePaymentLink(user, paymentOrder.getAmount(), paymentOrder.getId());
            paymentOrder.setPaymentLinkId(String.valueOf(paymentOrder.getId()));
            paymentOrderRepository.save(paymentOrder);
            return OrderCheckoutSupport.buildPaymentResponse(orders, paymentOrder.getId(), PaymentMethod.CARD, PaymentType.CARD, PaymentProvider.STRIPE, PaymentStatus.PENDING, OrderStatus.INITIATED, paymentUrl, String.valueOf(paymentOrder.getId()));
        } catch (Exception ex) {
            if (reservedCouponCode != null) {
                couponService.releaseCouponReservation(reservedCouponCode, user.getId(), "CHECKOUT_CREATE_FAILED", "Reservation released due to checkout failure");
            }
            throw ex;
        }
    }

    private PaymentLinkResponse createCashOnDeliveryResponse(User user, Address shippingAddress) throws Exception {
        Cart cart = requireCart(user);
        couponService.validateAppliedCoupon(user, cart);
        Set<Order> orders = orderService.createOrder(user, shippingAddress, cart, OrderStatus.PLACED, PaymentStatus.PENDING, PaymentMethod.COD, PaymentType.CASH, null);
        couponService.markCouponUsedIfPresent(user, orders);
        return OrderCheckoutSupport.buildPaymentResponse(orders, null, PaymentMethod.COD, PaymentType.CASH, null, PaymentStatus.PENDING, OrderStatus.PLACED, null, null);
    }

    private PaymentLinkResponse retryExistingPaymentOrder(User user, PaymentOrder paymentOrder) throws Exception {
        if (paymentOrder.getStatus() == PaymentOrderStatus.SUCCESS) {
            throw new IllegalArgumentException("Payment already completed for this checkout request");
        }
        if (paymentOrder.getUser() == null || !paymentOrder.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized payment retry access");
        }
        Set<Order> orders = paymentOrder.getOrders();
        if (orders == null || orders.isEmpty()) {
            throw new IllegalArgumentException("Cannot retry payment without order context");
        }
        if (paymentOrder.getCouponReservationState() == CouponReservationState.RELEASED) {
            couponService.reserveCouponForOrders(user, orders, "PAYMENT_RETRY:" + paymentOrder.getId());
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
        if (paymentOrder.getCouponReservationState() == null) {
            paymentOrder.setCouponReservationState(CouponReservationState.NONE);
        }
        paymentOrderRepository.save(paymentOrder);

        return OrderCheckoutSupport.buildPaymentResponse(orders, paymentOrder.getId(), paymentMethod, paymentType, provider, PaymentStatus.PENDING, OrderStatus.INITIATED, paymentUrl, paymentReference);
    }
}
