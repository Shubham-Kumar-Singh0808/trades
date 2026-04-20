package com.pawfectfoods.trades.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
        name = "trade_bid",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_trade_bid_trade_vendor_round", columnNames = {
                        "trade_id", "vendor_id", "round_number"
                })
        },
        indexes = {
                @Index(name = "idx_trade_bid_trade_round", columnList = "trade_id,round_number"),
                @Index(name = "idx_trade_bid_vendor", columnList = "vendor_id"),
                @Index(name = "idx_trade_bid_amount", columnList = "bidAmount")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeBid {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trade_id", nullable = false)
    private Trade trade;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal bidAmount;

    @Column(nullable = false)
    private Instant submittedAt;

    @Column(nullable = false)
    private Instant updatedAt;
}
