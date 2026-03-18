package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.PaymentOrderStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentOrderStatusConverter implements AttributeConverter<PaymentOrderStatus, String> {

    @Override
    public String convertToDatabaseColumn(PaymentOrderStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentOrderStatus convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                PaymentOrderStatus.class,
                PaymentOrderStatus.PENDING,
                "CAPTURED", "SUCCESS",
                "PAID", "SUCCESS",
                "COMPLETED", "SUCCESS",
                "CREATED", "PENDING"
        );
    }
}
