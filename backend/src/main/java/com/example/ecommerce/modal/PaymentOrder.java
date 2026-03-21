package com.example.ecommerce.modal;


import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.common.persistence.PaymentMethodConverter;
import com.example.ecommerce.common.persistence.PaymentOrderStatusConverter;
import com.example.ecommerce.common.persistence.PaymentProviderConverter;
import com.example.ecommerce.common.persistence.PaymentTypeConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @EqualsAndHashCode.Include
    private Long id;

    private Long amount;

    @Convert(converter = PaymentOrderStatusConverter.class)
    private PaymentOrderStatus status = PaymentOrderStatus.PENDING;

    @Convert(converter = PaymentMethodConverter.class)
    private PaymentMethod paymentMethod;

    @Convert(converter = PaymentTypeConverter.class)
    private PaymentType paymentType;

    @Convert(converter = PaymentProviderConverter.class)
    private PaymentProvider provider;

    private String paymentLinkId;
    private String merchantTransactionId;

    @ManyToOne
    private User user;

    @OneToMany
    private Set<Order> orders = new HashSet<>();

}



