package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.common.persistence.OrderStatusConverter;
import com.example.ecommerce.common.persistence.PaymentMethodConverter;
import com.example.ecommerce.common.persistence.PaymentProviderConverter;
import com.example.ecommerce.common.persistence.PaymentStatusConverter;
import com.example.ecommerce.common.persistence.PaymentTypeConverter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @EqualsAndHashCode.Include
    private Long id;

    private String orderId;
    private Long sellerId;

    @ManyToOne
    @JsonIgnoreProperties({
            "addresses",
            "usedCoupons",
            "password",
            "hibernateLazyInitializer",
            "handler"
    })
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @ManyToOne
    private Address shippingAddress;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private OrderTaxSnapshot orderTaxSnapshot;

    @Embedded
    private PaymentDetails paymentDetails = new PaymentDetails();

    private double totalMrpPrice;
    private Integer totalSellingPrice;
    private double discount;
    private String couponCode;

    @Convert(converter = OrderStatusConverter.class)
    private OrderStatus orderStatus;

    private int totalItems;

    @Convert(converter = PaymentMethodConverter.class)
    private PaymentMethod paymentMethod;

    @Convert(converter = PaymentTypeConverter.class)
    private PaymentType paymentType;

    @Convert(converter = PaymentProviderConverter.class)
    private PaymentProvider provider;

    @Convert(converter = PaymentStatusConverter.class)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String cancelReasonCode;
    private String cancelReasonText;
    private LocalDateTime cancelledAt;

    private LocalDateTime orderDate = LocalDateTime.now();
    private LocalDateTime shippedAt;
    private LocalDateTime deliveryDate = orderDate.plusDays(7);
    private LocalDateTime deliveredAt;



}



