package com.example.ecommerce.common.persistence;

import java.util.Locale;

final class LegacyEnumValueNormalizer {

    private LegacyEnumValueNormalizer() {
    }

    static <E extends Enum<E>> E normalize(
            String dbValue,
            Class<E> enumType,
            E fallback,
            String... aliases
    ) {
        if (dbValue == null || dbValue.isBlank()) {
            return fallback;
        }

        String trimmed = dbValue.trim();

        for (E constant : enumType.getEnumConstants()) {
            if (constant.name().equalsIgnoreCase(trimmed)) {
                return constant;
            }
        }

        if (trimmed.chars().allMatch(Character::isDigit)) {
            int ordinal = Integer.parseInt(trimmed);
            E[] constants = enumType.getEnumConstants();
            if (ordinal >= 0 && ordinal < constants.length) {
                return constants[ordinal];
            }
            return fallback;
        }

        String normalized = trimmed
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);

        for (int i = 0; i + 1 < aliases.length; i += 2) {
            if (normalized.equals(aliases[i])) {
                return Enum.valueOf(enumType, aliases[i + 1]);
            }
        }

        return fallback;
    }
}
