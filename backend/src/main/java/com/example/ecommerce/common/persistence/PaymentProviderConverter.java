package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.PaymentProvider;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentProviderConverter implements AttributeConverter<PaymentProvider, String> {

    @Override
    public String convertToDatabaseColumn(PaymentProvider attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentProvider convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                PaymentProvider.class,
                null,
                "ONLINE", "PHONEPE"
        );
    }
}
