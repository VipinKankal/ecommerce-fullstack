package com.example.ecommerce.common.utils;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class IndianStateCodeResolver {

    private static final Map<String, String> STATE_CODES = new HashMap<>();

    static {
        register("01", "JAMMU AND KASHMIR");
        register("02", "HIMACHAL PRADESH");
        register("03", "PUNJAB");
        register("04", "CHANDIGARH");
        register("05", "UTTARAKHAND");
        register("06", "HARYANA");
        register("07", "DELHI", "NCT OF DELHI", "NEW DELHI");
        register("08", "RAJASTHAN");
        register("09", "UTTAR PRADESH");
        register("10", "BIHAR");
        register("11", "SIKKIM");
        register("12", "ARUNACHAL PRADESH");
        register("13", "NAGALAND");
        register("14", "MANIPUR");
        register("15", "MIZORAM");
        register("16", "TRIPURA");
        register("17", "MEGHALAYA");
        register("18", "ASSAM");
        register("19", "WEST BENGAL");
        register("20", "JHARKHAND");
        register("21", "ODISHA", "ORISSA");
        register("22", "CHHATTISGARH");
        register("23", "MADHYA PRADESH");
        register("24", "GUJARAT");
        register("26", "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", "DAMAN AND DIU", "DADRA AND NAGAR HAVELI");
        register("27", "MAHARASHTRA");
        register("29", "KARNATAKA");
        register("30", "GOA");
        register("31", "LAKSHADWEEP");
        register("32", "KERALA");
        register("33", "TAMIL NADU");
        register("34", "PUDUCHERRY");
        register("35", "ANDAMAN AND NICOBAR ISLANDS");
        register("36", "TELANGANA");
        register("37", "ANDHRA PRADESH");
        register("38", "LADAKH");
        register("97", "OTHER TERRITORY");
    }

    private IndianStateCodeResolver() {
    }

    public static String resolveStateCode(String rawState) {
        if (rawState == null || rawState.isBlank()) {
            return null;
        }
        String normalized = normalize(rawState);
        if (normalized.matches("\\d{2}")) {
            return normalized;
        }
        return STATE_CODES.get(normalized);
    }

    private static void register(String code, String... names) {
        STATE_CODES.put(code, code);
        for (String name : names) {
            STATE_CODES.put(normalize(name), code);
        }
    }

    private static String normalize(String value) {
        return value.trim()
                .replace('&', ' ')
                .replaceAll("[^A-Za-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .toUpperCase(Locale.ROOT);
    }
}
