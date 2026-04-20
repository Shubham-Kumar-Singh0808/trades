package com.pawfectfoods.trades.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
        name = "trade",
        indexes = {
                @Index(name = "idx_trade_trade_id", columnList = "tradeId"),
                @Index(name = "idx_trade_created_at", columnList = "createdAt")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trade {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String tradeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TradeMode mode;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
        private String jobSheetPdfPath;

        @Column(nullable = false)
        private String trackingListPdfPath;

    @Column(nullable = false)
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Builder.Default
    @Column(nullable = false)
    private boolean biddingOpen = true;

    @Builder.Default
    @Column(nullable = false)
    private int currentRound = 1;

    private Instant closedAt;

    @Column(precision = 12, scale = 4)
    private BigDecimal finalL1Rate;
}
