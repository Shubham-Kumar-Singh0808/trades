package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.Trade;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TradeRepository extends JpaRepository<Trade, UUID> {
    boolean existsByTradeId(String tradeId);

    @Query(
            value = """
                    select t
                    from Trade t
                    where exists (
                        select 1
                        from TradeBid b
                        where b.trade = t and b.vendor.id = :vendorId
                    )
                    """,
            countQuery = """
                    select count(t)
                    from Trade t
                    where exists (
                        select 1
                        from TradeBid b
                        where b.trade = t and b.vendor.id = :vendorId
                    )
                    """)
    Page<Trade> findDistinctByVendorId(@Param("vendorId") UUID vendorId, Pageable pageable);
}
