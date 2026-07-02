package com.pawfectfoods.trades.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class TradeModeConverter implements AttributeConverter<TradeMode, String> {

    @Override
    public String convertToDatabaseColumn(TradeMode mode) {
        if (mode == null) {
            return null;
        }
        return mode.name(); // stores "AIR" or "SEA"
    }

    @Override
    public TradeMode convertToEntityAttribute(String dbValue) {
        if (dbValue == null || dbValue.isBlank()) {
            return null;
        }
        return switch (dbValue.trim().toUpperCase()) {
            case "AIR"                         -> TradeMode.AIR;
            case "SEA"                         -> TradeMode.SEA;
            // Legacy values stored in DB before the AIR/SEA rename
            case "ONLINE", "DIRECT"            -> TradeMode.AIR;
            case "HYBRID", "HOPPING", "OFFLINE" -> TradeMode.SEA;
            default -> TradeMode.valueOf(dbValue.trim().toUpperCase());
        };
    }
}
