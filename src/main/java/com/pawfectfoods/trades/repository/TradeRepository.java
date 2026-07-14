package com.pawfectfoods.trades.repository;

import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.Trade;
import com.pawfectfoods.trades.model.TradeMode;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TradeRepository extends JpaRepository<Trade, UUID> {
    boolean existsByTradeId(String tradeId);

    java.util.List<Trade> findByCreatedBy(AppUser createdBy);

    java.util.List<Trade> findByBiddingOpenTrueAndClosedAtIsNullAndAutoCloseAtLessThanEqual(Instant autoCloseAt);

    @Query(
            value = """
                    select t
                    from Trade t
                    where (
                        :query is null
                        or :query = ''
                        or lower(t.tradeId) like lower(concat('%', :query, '%'))
                        or lower(t.description) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.email, '')) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.name, '')) like lower(concat('%', :query, '%'))
                    )
                    and (:mode is null or t.mode = :mode)
                    and (
                        :status = 'ALL'
                        or (:status = 'OPEN' and t.closedAt is null and t.biddingOpen = true)
                        or (:status = 'ROUND_CLOSED' and t.closedAt is null and t.biddingOpen = false)
                        or (:status = 'FINALIZED' and t.closedAt is not null)
                    )
                    """,
            countQuery = """
                    select count(t)
                    from Trade t
                    where (
                        :query is null
                        or :query = ''
                        or lower(t.tradeId) like lower(concat('%', :query, '%'))
                        or lower(t.description) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.email, '')) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.name, '')) like lower(concat('%', :query, '%'))
                    )
                    and (:mode is null or t.mode = :mode)
                    and (
                        :status = 'ALL'
                        or (:status = 'OPEN' and t.closedAt is null and t.biddingOpen = true)
                        or (:status = 'ROUND_CLOSED' and t.closedAt is null and t.biddingOpen = false)
                        or (:status = 'FINALIZED' and t.closedAt is not null)
                    )
                    """)
    Page<Trade> searchAllTrades(
            @Param("query") String query,
            @Param("mode") TradeMode mode,
            @Param("status") String status,
            Pageable pageable);

    @Query(
            value = """
                    select t
                    from Trade t
                    where exists (
                        select 1
                        from TradeBid b
                        where b.trade = t and b.vendor.id = :vendorId
                    )
                    and (
                        :query is null
                        or :query = ''
                        or lower(t.tradeId) like lower(concat('%', :query, '%'))
                        or lower(t.description) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.email, '')) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.name, '')) like lower(concat('%', :query, '%'))
                    )
                    and (:mode is null or t.mode = :mode)
                    and (
                        :status = 'ALL'
                        or (:status = 'OPEN' and t.closedAt is null and t.biddingOpen = true)
                        or (:status = 'ROUND_CLOSED' and t.closedAt is null and t.biddingOpen = false)
                        or (:status = 'FINALIZED' and t.closedAt is not null)
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
                    and (
                        :query is null
                        or :query = ''
                        or lower(t.tradeId) like lower(concat('%', :query, '%'))
                        or lower(t.description) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.email, '')) like lower(concat('%', :query, '%'))
                        or lower(coalesce(t.createdBy.name, '')) like lower(concat('%', :query, '%'))
                    )
                    and (:mode is null or t.mode = :mode)
                    and (
                        :status = 'ALL'
                        or (:status = 'OPEN' and t.closedAt is null and t.biddingOpen = true)
                        or (:status = 'ROUND_CLOSED' and t.closedAt is null and t.biddingOpen = false)
                        or (:status = 'FINALIZED' and t.closedAt is not null)
                    )
                    """)
    Page<Trade> searchTradesForVendor(
            @Param("vendorId") UUID vendorId,
            @Param("query") String query,
            @Param("mode") TradeMode mode,
            @Param("status") String status,
            Pageable pageable);

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
