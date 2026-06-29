package com.pawfectfoods.trades.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TradeAutoCloseScheduler {

    private final TradeService tradeService;

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kolkata")
    public void closeDueTrades() {
        tradeService.autoCloseDueTrades();
    }
}