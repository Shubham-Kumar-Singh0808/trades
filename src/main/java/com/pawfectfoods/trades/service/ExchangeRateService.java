package com.pawfectfoods.trades.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Fetches the USD→INR exchange rate from a free public API.
 * Caches the result for 1 hour to avoid excessive API calls.
 */
@Service
@Slf4j
public class ExchangeRateService {

    private static final String RATE_API_URL = "https://open.er-api.com/v6/latest/USD";
    private static final long CACHE_TTL_HOURS = 1;

    private BigDecimal cachedRate = null;
    private Instant cacheTime = null;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Returns the current USD→INR exchange rate.
     * Returns null if the rate cannot be fetched and no valid cache exists.
     */
    @SuppressWarnings("unchecked")
    public BigDecimal getUsdToInrRate() {
        if (cachedRate != null && cacheTime != null
                && Instant.now().isBefore(cacheTime.plus(CACHE_TTL_HOURS, ChronoUnit.HOURS))) {
            return cachedRate;
        }
        try {
            Map<String, Object> response = restTemplate.getForObject(RATE_API_URL, Map.class);
            if (response != null && "success".equals(response.get("result"))) {
                Map<String, Object> rates = (Map<String, Object>) response.get("rates");
                if (rates != null && rates.get("INR") != null) {
                    Object inrValue = rates.get("INR");
                    BigDecimal rate = new BigDecimal(inrValue.toString());
                    cachedRate = rate;
                    cacheTime = Instant.now();
                    log.info("Fetched USD/INR rate: {}", rate);
                    return rate;
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch USD/INR exchange rate: {}", ex.getMessage());
        }
        // Return stale cache if available, otherwise null
        return cachedRate;
    }
}
