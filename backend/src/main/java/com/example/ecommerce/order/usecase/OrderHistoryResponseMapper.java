package com.example.ecommerce.order.usecase;

import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.order.response.OrderHistoryItemResponse;
import com.example.ecommerce.order.response.OrderHistoryProductResponse;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.response.OrderShippingAddressResponse;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class OrderHistoryResponseMapper {

    public OrderHistoryResponse toOrderHistoryResponse(Order order) {
        OrderHistoryResponse response = new OrderHistoryResponse();
        response.setId(order.getId());
        response.setOrderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : "PENDING");
        response.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentType(order.getPaymentType());
        response.setProvider(order.getProvider());
        response.setTotalSellingPrice(order.getTotalSellingPrice());
        response.setTotalItems(order.getTotalItems());
        response.setOrderDate(order.getOrderDate());
        response.setDeliveredAt(order.getDeliveredAt());
        response.setCancelledAt(order.getCancelledAt());
        response.setCancelReasonCode(order.getCancelReasonCode());
        response.setCancelReasonText(order.getCancelReasonText());
        response.setShippingAddress(toShippingAddressResponse(order.getShippingAddress()));
        response.setOrderTaxSnapshot(ResponseMapper.toOrderTaxSnapshotResponse(order.getOrderTaxSnapshot()));

        List<OrderHistoryItemResponse> items = order.getOrderItems().stream()
                .map(this::toOrderItemResponse)
                .toList();
        response.setOrderItems(items);

        return response;
    }

    public OrderHistoryItemResponse toOrderItemResponse(OrderItem orderItem) {
        OrderHistoryItemResponse itemResponse = new OrderHistoryItemResponse();
        itemResponse.setId(orderItem.getId());
        itemResponse.setSize(orderItem.getSize());
        itemResponse.setQuantity(orderItem.getQuantity());
        itemResponse.setMrpPrice(orderItem.getMrpPrice());
        itemResponse.setSellingPrice(orderItem.getSellingPrice());

        if (orderItem.getProduct() != null) {
            OrderHistoryProductResponse product = new OrderHistoryProductResponse();
            product.setId(orderItem.getProduct().getId());
            product.setTitle(orderItem.getProduct().getTitle());
            product.setDescription(orderItem.getProduct().getDescription());
            if (Hibernate.isInitialized(orderItem.getProduct().getImages())) {
                product.setImages(new ArrayList<>(orderItem.getProduct().getImages()));
            } else {
                product.setImages(List.of());
            }
            itemResponse.setProduct(product);
        }

        return itemResponse;
    }

    private OrderShippingAddressResponse toShippingAddressResponse(Address address) {
        if (address == null) return null;
        OrderShippingAddressResponse response = new OrderShippingAddressResponse();
        response.setName(address.getName());
        response.setStreet(address.getStreet());
        response.setLocality(address.getLocality());
        response.setAddress(address.getAddress());
        response.setCity(address.getCity());
        response.setState(address.getState());
        response.setPinCode(address.getPinCode());
        response.setMobileNumber(address.getMobileNumber());
        return response;
    }
}

