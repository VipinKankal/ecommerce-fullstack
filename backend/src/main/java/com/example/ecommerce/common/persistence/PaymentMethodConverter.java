package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.PaymentMethod;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                PaymentMethod.class,
                PaymentMethod.UPI,
                "RAZORPAY", "UPI",
                "PHONEPE", "UPI",
                "ONLINE", "UPI",
                "STRIPE", "CARD",
                "CASH", "COD"
        );
    }
}
