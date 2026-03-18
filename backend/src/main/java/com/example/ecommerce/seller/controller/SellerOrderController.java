package com.example.ecommerce.seller.controller;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.seller.response.SellerOrderResponse;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/seller/orders")
@PreAuthorize("hasRole('SELLER')")
public class SellerOrderController {

    private final OrderService orderService;
    private final SellerService sellerService;

    @GetMapping
    public ResponseEntity<List<SellerOrderResponse>> getAllOrdersHandler(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        List<Order> orders = orderService.sellersOrder(seller.getId());
        return new ResponseEntity<>(ResponseMapper.toSellerOrderResponses(orders), HttpStatus.OK);
    }

    @PatchMapping("/{orderId}/status/{orderStatus}")
    public ResponseEntity<SellerOrderResponse> updateOrderHandler(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long orderId,
            @PathVariable OrderStatus orderStatus
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Order order = orderService.updateOrderStatusBySeller(orderId, orderStatus, seller.getId());
        return new ResponseEntity<>(ResponseMapper.toSellerOrderResponse(order), HttpStatus.ACCEPTED);
    }
}




