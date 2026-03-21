package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.PaymentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentTypeConverter implements AttributeConverter<PaymentType, String> {

    @Override
    public String convertToDatabaseColumn(PaymentType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentType convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                PaymentType.class,
                null,
                "ONLINE", "UPI"
        );
    }
}
