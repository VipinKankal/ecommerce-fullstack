package com.example.ecommerce.common.mapper;

import com.example.ecommerce.catalog.response.ProductResponse;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.order.response.OrderTaxSnapshotResponse;
import com.example.ecommerce.seller.response.SellerOrderResponse;
import com.example.ecommerce.seller.response.SellerResponse;

import java.util.Collections;
import java.util.List;

public final class ResponseMapper {

    private ResponseMapper() {
    }

    public static ProductResponse toProductResponse(Product product) {
        return ResponseMapperSupport.toProductResponse(product);
    }

    public static List<ProductResponse> toProductResponses(List<Product> products) {
        return products == null ? Collections.emptyList() : products.stream().map(ResponseMapperSupport::toProductResponse).toList();
    }

    public static SellerResponse toSellerResponse(Seller seller) {
        return ResponseMapperSupport.toSellerResponse(seller);
    }

    public static List<SellerResponse> toSellerResponses(List<Seller> sellers) {
        return sellers == null ? Collections.emptyList() : sellers.stream().map(ResponseMapperSupport::toSellerResponse).toList();
    }

    public static SellerOrderResponse toSellerOrderResponse(Order order) {
        return ResponseMapperSupport.toSellerOrderResponse(order);
    }

    public static List<SellerOrderResponse> toSellerOrderResponses(List<Order> orders) {
        return orders == null ? Collections.emptyList() : orders.stream().map(ResponseMapperSupport::toSellerOrderResponse).toList();
    }

    public static OrderTaxSnapshotResponse toOrderTaxSnapshotResponse(OrderTaxSnapshot snapshot) {
        return ResponseMapperSupport.toOrderTaxSnapshotResponse(snapshot);
    }
}
