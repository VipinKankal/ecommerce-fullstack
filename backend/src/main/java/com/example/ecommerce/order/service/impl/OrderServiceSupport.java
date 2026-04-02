package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ProductVariantRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

final class OrderServiceSupport {

    private OrderServiceSupport() {
    }

    static Map<Long, List<CartItem>> groupItemsBySeller(Cart cart) {
        return cart.getCartItems().stream().collect(Collectors.groupingBy(item -> item.getProduct().getSeller().getId()));
    }

    static int calculateCartSubtotal(Cart cart) {
        return cart.getCartItems().stream().map(CartItem::getSellingPrice).filter(Objects::nonNull).mapToInt(Integer::intValue).sum();
    }

    static int calculateSellerSubtotal(List<CartItem> items) {
        return items.stream().map(CartItem::getSellingPrice).filter(Objects::nonNull).mapToInt(Integer::intValue).sum();
    }

    static int calculateSellerMrpTotal(List<CartItem> items) {
        return items.stream().map(CartItem::getMrpPrice).filter(Objects::nonNull).mapToInt(Integer::intValue).sum();
    }

    static int calculateTotalItemCount(List<CartItem> items) {
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }

    static int calculateCouponDiscountShare(int index, int sellerCount, int sellerSubtotal, double totalCouponDiscount, int subtotalBeforeCoupon, int remainingCouponDiscount) {
        if (index == sellerCount - 1) {
            return remainingCouponDiscount;
        }
        if (subtotalBeforeCoupon <= 0 || remainingCouponDiscount <= 0) {
            return 0;
        }
        int sellerCouponDiscount = (int) Math.round((double) sellerSubtotal * totalCouponDiscount / subtotalBeforeCoupon);
        return Math.min(sellerCouponDiscount, remainingCouponDiscount);
    }

    static OrderItem createOrderItem(Order savedOrder, CartItem item) {
        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(savedOrder);
        orderItem.setMrpPrice(item.getMrpPrice());
        orderItem.setProduct(item.getProduct());
        orderItem.setQuantity(item.getQuantity());
        orderItem.setSize(item.getSize());
        orderItem.setUserId(item.getUserId());
        orderItem.setSellingPrice(item.getSellingPrice());
        savedOrder.getOrderItems().add(orderItem);
        return orderItem;
    }

    static OrderItem persistAndAllocateOrderItem(
            OrderItem orderItem,
            OrderItemRepository orderItemRepository,
            ProductVariantRepository productVariantRepository,
            ProductRepository productRepository,
            InventoryService inventoryService,
            RestockNotificationService restockNotificationService
    ) {
        OrderItem savedOrderItem = orderItemRepository.save(orderItem);
        deductVariantWarehouseStock(orderItem.getProduct(), orderItem.getSize(), orderItem.getQuantity(), productVariantRepository, productRepository);
        inventoryService.deductWarehouseStockForOrder(orderItem.getProduct(), orderItem.getQuantity(), savedOrderItem.getId());
        if (orderItem.getOrder() != null && orderItem.getOrder().getUser() != null) {
            restockNotificationService.markSubscriptionConverted(orderItem.getOrder().getUser(), orderItem.getProduct());
        }
        return savedOrderItem;
    }

    static void restoreOrderItemStock(
            OrderItem orderItem,
            ProductVariantRepository productVariantRepository,
            ProductRepository productRepository,
            InventoryService inventoryService
    ) {
        if (orderItem.getProduct() == null) {
            return;
        }
        restoreVariantWarehouseStock(orderItem.getProduct(), orderItem.getSize(), orderItem.getQuantity(), productVariantRepository, productRepository);
        inventoryService.restoreWarehouseStockFromCancellation(orderItem.getProduct(), orderItem.getQuantity(), orderItem.getId(), "Admin cancelled order and stock returned to warehouse");
    }

    static void clearPurchasedCart(Cart cart) {
        cart.getCartItems().clear();
        cart.setTotalItems(0);
        cart.setTotalMrpPrice(0);
        cart.setTotalSellingPrice(0);
        cart.setDiscount(0);
        cart.setCouponCode(null);
    }

    static void stampStatusTransition(Order order, OrderStatus status) {
        order.setOrderStatus(status);
        if (status == OrderStatus.SHIPPED && order.getShippedAt() == null) {
            order.setShippedAt(LocalDateTime.now());
        }
        if (status == OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }
    }

    static void validateAdminStatusTransition(OrderStatus currentStatus, OrderStatus nextStatus) {
        if (currentStatus == OrderStatus.CANCELLED
                || currentStatus == OrderStatus.DELIVERED
                || currentStatus == OrderStatus.SHIPPED
                || currentStatus == OrderStatus.OUT_FOR_DELIVERY) {
            throw new IllegalArgumentException("Order status can no longer be changed from " + currentStatus);
        }

        if (nextStatus == OrderStatus.CONFIRMED
                && currentStatus != OrderStatus.INITIATED
                && currentStatus != OrderStatus.PENDING
                && currentStatus != OrderStatus.PLACED) {
            throw new IllegalArgumentException("Only placed orders can be confirmed");
        }

        if (nextStatus == OrderStatus.PACKED && currentStatus != OrderStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only confirmed orders can be packed");
        }

        if (nextStatus == OrderStatus.SHIPPED
                && currentStatus != OrderStatus.PACKED
                && currentStatus != OrderStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only packed orders can be shipped");
        }
    }

    private static void deductVariantWarehouseStock(Product product, String size, int quantity, ProductVariantRepository productVariantRepository, ProductRepository productRepository) {
        if (product == null || product.getId() == null || size == null || size.isBlank()) {
            return;
        }
        productVariantRepository.findByProductIdAndSizeIgnoreCase(product.getId(), size.trim()).ifPresent(variant -> {
            int available = Math.max(variant.getWarehouseStock() == null ? 0 : variant.getWarehouseStock(), 0);
            if (available < quantity) {
                throw new IllegalArgumentException("Selected size is not available in requested quantity");
            }
            variant.setWarehouseStock(available - quantity);
            productVariantRepository.save(variant);
            productRepository.save(product);
        });
    }

    private static void restoreVariantWarehouseStock(Product product, String size, int quantity, ProductVariantRepository productVariantRepository, ProductRepository productRepository) {
        if (product == null || product.getId() == null || size == null || size.isBlank()) {
            return;
        }
        productVariantRepository.findByProductIdAndSizeIgnoreCase(product.getId(), size.trim()).ifPresent(variant -> {
            int available = Math.max(variant.getWarehouseStock() == null ? 0 : variant.getWarehouseStock(), 0);
            variant.setWarehouseStock(available + quantity);
            productVariantRepository.save(variant);
            productRepository.save(product);
        });
    }
}
