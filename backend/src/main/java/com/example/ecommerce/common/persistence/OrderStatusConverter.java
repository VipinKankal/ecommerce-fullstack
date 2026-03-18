package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.OrderStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class OrderStatusConverter implements AttributeConverter<OrderStatus, String> {

    @Override
    public String convertToDatabaseColumn(OrderStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public OrderStatus convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                OrderStatus.class,
                OrderStatus.PENDING,
                "COMPLETE", "DELIVERED",
                "COMPLETED", "DELIVERED"
        );
    }
}
