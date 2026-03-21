package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.PaymentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {

    @Override
    public String convertToDatabaseColumn(PaymentStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                PaymentStatus.class,
                PaymentStatus.PENDING,
                "CAPTURED", "SUCCESS",
                "PAID", "SUCCESS",
                "COMPLETED", "SUCCESS",
                "CREATED", "PENDING"
        );
    }
}
