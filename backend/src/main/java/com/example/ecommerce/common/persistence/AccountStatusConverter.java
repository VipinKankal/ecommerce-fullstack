package com.example.ecommerce.common.persistence;

import com.example.ecommerce.common.domain.AccountStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AccountStatusConverter implements AttributeConverter<AccountStatus, String> {

    @Override
    public String convertToDatabaseColumn(AccountStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public AccountStatus convertToEntityAttribute(String dbData) {
        return LegacyEnumValueNormalizer.normalize(
                dbData,
                AccountStatus.class,
                null,
                "VERIFIED", "ACTIVE",
                "INACTIVE", "DEACTIVATED",
                "DISABLED", "SUSPENDED"
        );
    }
}
