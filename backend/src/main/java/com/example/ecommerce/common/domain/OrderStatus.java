package com.example.ecommerce.common.domain;

public enum OrderStatus {
    INITIATED,
    PENDING,
    PLACED,
    CONFIRMED,
    SHIPPED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    RETURN_REQUESTED,
    RETURNED,
    EXCHANGE_REQUESTED,
    EXCHANGE_SHIPPED,
    CANCELLED
}
