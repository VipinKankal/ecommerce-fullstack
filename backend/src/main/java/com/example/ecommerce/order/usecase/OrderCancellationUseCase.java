package com.example.ecommerce.order.usecase;

import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.SellerReport;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.CancelOrderRequest;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.seller.service.SellerReportService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderCancellationUseCase {
    private static final List<String> CANCEL_REASONS = List.of(
            "FOUND_BETTER_PRICE",
            "CHANGED_MY_MIND",
            "ORDERED_BY_MISTAKE",
            "DELIVERY_IS_TOO_LATE",
            "NEED_TO_CHANGE_ADDRESS",
            "PAYMENT_ISSUE",
            "OTHER"
    );

    private final OrderService orderService;
    private final UserService userService;
    private final CouponService couponService;
    private final InventoryService inventoryService;
    private final SellerService sellerService;
    private final SellerReportService sellerReportService;
    private final OrderHistoryResponseMapper orderHistoryResponseMapper;

    public List<String> getCancelReasons() {
        return CANCEL_REASONS;
    }

    public OrderHistoryResponse cancelOrder(Long orderId, CancelOrderRequest request, String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Order order = orderService.cancelOrder(
                orderId,
                user,
                request.getCancelReasonCode(),
                request.getCancelReasonText()
        );
        couponService.releaseCouponReservation(
                order.getCouponCode(),
                user.getId(),
                "ORDER_CANCELLED",
                "Reservation released due to customer cancellation"
        );
        couponService.restoreCouponUsageForCancelledOrders(
                user,
                List.of(order),
                "Order cancelled by customer before shipment"
        );

        if (order.getOrderItems() != null) {
            for (OrderItem orderItem : order.getOrderItems()) {
                if (orderItem.getProduct() != null) {
                    inventoryService.restoreWarehouseStockFromCancellation(
                            orderItem.getProduct(),
                            orderItem.getQuantity(),
                            orderItem.getId(),
                            "Order cancelled and stock returned to warehouse"
                    );
                }
            }
        }

        Seller seller = sellerService.getSellerById(order.getSellerId());
        SellerReport report = sellerReportService.getSellerReport(seller);
        report.setCancelledOrders(report.getCancelledOrders() + 1);
        report.setTotalRefunds(report.getTotalRefunds() + order.getTotalSellingPrice());
        sellerReportService.updateSellerReport(report);

        return orderHistoryResponseMapper.toOrderHistoryResponse(order);
    }
}

