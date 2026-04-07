package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.Trade;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeRepository extends JpaRepository<Trade, UUID> {
    boolean existsByTradeId(String tradeId);
}
