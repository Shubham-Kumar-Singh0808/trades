package com.pawfectfoods.trades.config;

import com.pawfectfoods.trades.model.TradeMode;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class TradeModeConverter implements Converter<String, TradeMode> {

    @Override
    public TradeMode convert(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }
        return TradeMode.fromValue(source);
    }
}
