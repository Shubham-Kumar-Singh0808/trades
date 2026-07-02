package com.pawfectfoods.trades.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum TradeMode {
    AIR,
    SEA;

    @JsonCreator
    public static TradeMode fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            // Current values
            case "AIR" -> AIR;
            case "SEA" -> SEA;
            // Legacy aliases
            case "DIRECT", "ONLINE" -> AIR;
            case "HOPPING", "HYBRID", "OFFLINE" -> SEA;
            default -> TradeMode.valueOf(normalized);
        };
    }
}
