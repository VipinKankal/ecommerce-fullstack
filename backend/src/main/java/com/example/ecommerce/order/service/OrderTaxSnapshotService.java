package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderTaxSnapshot;

import java.util.List;

public interface OrderTaxSnapshotService {
    OrderTaxSnapshot freezeSnapshot(Order order, List<OrderItem> orderItems, double orderLevelDiscount);
}
