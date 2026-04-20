package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.Trade;
import com.pawfectfoods.trades.model.TradeBid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TradeBidRepository extends JpaRepository<TradeBid, UUID> {

    Optional<TradeBid> findByTrade_IdAndVendor_IdAndRoundNumber(UUID tradeId, UUID vendorId, int roundNumber);

    List<TradeBid> findByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(UUID tradeId, int roundNumber);

    Optional<TradeBid> findFirstByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(UUID tradeId, int roundNumber);

    List<TradeBid> findByTrade_IdOrderByRoundNumberAscBidAmountAscUpdatedAtAsc(UUID tradeId);

    List<TradeBid> findByTrade_IdAndVendor_IdOrderByRoundNumberAscUpdatedAtDesc(UUID tradeId, UUID vendorId);

    @Query("select distinct b.vendor.email from TradeBid b where b.trade.id = :tradeId")
    List<String> findDistinctParticipantEmailsByTradeId(@Param("tradeId") UUID tradeId);

    @Query("select min(b.bidAmount) from TradeBid b where b.trade.id = :tradeId")
    java.math.BigDecimal findOverallLowestBidAmountByTradeId(@Param("tradeId") UUID tradeId);

    @Query("select distinct b.trade from TradeBid b where b.vendor.id = :vendorId")
    Page<Trade> findDistinctTradesByVendorId(@Param("vendorId") UUID vendorId, Pageable pageable);

    boolean existsByTrade_IdAndVendor_Id(UUID tradeId, UUID vendorId);
}
