package com.pawfectfoods.trades.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum TradeMode {
    ONLINE,
    OFFLINE,
    HYBRID;

    @JsonCreator
    public static TradeMode fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "DIRECT" -> ONLINE;
            case "HOPPING" -> HYBRID;
            default -> TradeMode.valueOf(normalized);
        };
    }
}
