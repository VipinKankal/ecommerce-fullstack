package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.UserRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class UserRoleConverter implements AttributeConverter<UserRole, String> {

    @Override
    public String convertToDatabaseColumn(UserRole attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public UserRole convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                UserRole.class,
                null,
                "ADMIN", "ROLE_ADMIN",
                "CUSTOMER", "ROLE_CUSTOMER",
                "SELLER", "ROLE_SELLER"
        );
    }
}
