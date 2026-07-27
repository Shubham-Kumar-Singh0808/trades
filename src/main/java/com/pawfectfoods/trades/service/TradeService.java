package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.BidSubmitRequest;
import com.pawfectfoods.trades.dto.CreateTradeRequest;
import com.pawfectfoods.trades.dto.MessageResponse;
import com.pawfectfoods.trades.dto.TradeBidBoardResponse;
import com.pawfectfoods.trades.dto.TradeBidEntryResponse;
import com.pawfectfoods.trades.dto.TradeBidRankResponse;
import com.pawfectfoods.trades.dto.TradeNotificationScope;
import com.pawfectfoods.trades.dto.TradeResponse;
import com.pawfectfoods.trades.dto.TradeStatsResponse;
import com.pawfectfoods.trades.dto.TradeReportResponse;
import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.RoleName;
import com.pawfectfoods.trades.model.Trade;
import com.pawfectfoods.trades.model.TradeBid;
import com.pawfectfoods.trades.model.TradeMode;
import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.TradeBidRepository;
import com.pawfectfoods.trades.repository.TradeRepository;
import com.pawfectfoods.trades.repository.VendorRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TradeService {

    private final TradeRepository tradeRepository;
    private final TradeBidRepository tradeBidRepository;
    private final AppUserRepository appUserRepository;
    private final VendorRepository vendorRepository;
    private final FileStorageService fileStorageService;
    private final PdfWatermarkService pdfWatermarkService;
    private final EmailService emailService;
    private final ExchangeRateService exchangeRateService;

    @Value("${app.frontend.base-url:http://localhost:4000}")
    private String frontendBaseUrl;

    @Value("${app.trade.auto-close-zone:Asia/Kolkata}")
    private String tradeAutoCloseZone;

    @Value("${app.trade.auto-close-hour:10}")
    private int tradeAutoCloseHour;

    @Transactional
    public TradeResponse createTrade(CreateTradeRequest request) {
        if (tradeRepository.existsByTradeId(request.tradeId())) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.TRADE_ALREADY_EXISTS,
                    "Trade ID already exists");
        }

        String jobSheetPdfPath = fileStorageService.saveFile(request.jobSheetFile());
        String trackingListPdfPath = fileStorageService.saveFile(request.trackingListFile());
        AppUser createdBy = resolveCurrentUser();

        Instant now = Instant.now();
        Trade trade = Trade.builder()
            .tradeId(request.tradeId())
            .mode(request.mode())
            .description(request.description())
            .jobSheetPdfPath(jobSheetPdfPath)
            .trackingListPdfPath(trackingListPdfPath)
            .createdAt(now)
            .autoCloseAt(now.plus(java.time.Duration.ofHours(12)))
            .createdBy(createdBy)
            .biddingOpen(true)
            .currentRound(1)
            .finalL1Rate(null)
            .build();

        Trade savedTrade = tradeRepository.save(trade);

        List<String> recipients = resolveNotificationRecipients(request);
        String detailsUrl = frontendBaseUrl + "/trades/" + savedTrade.getId();

        emailService.sendTradeCreatedNotification(
                recipients,
                savedTrade.getTradeId(),
                savedTrade.getDescription(),
                toDisplayMode(savedTrade.getMode()),
                detailsUrl);

        return toResponse(savedTrade);
    }

        @Transactional
        public MessageResponse submitBid(UUID tradeId, BidSubmitRequest request) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        if (!trade.isBiddingOpen()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_CLOSED,
                "Bidding is closed for this trade");
        }

        if (trade.getClosedAt() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_CLOSED,
                "Trade is already closed");
        }

        Vendor vendor = resolveCurrentVendor();

        if (trade.getCurrentRound() == 2) {
            boolean participatedInRound1 = tradeBidRepository
                .findByTrade_IdAndVendor_IdAndRoundNumber(tradeId, vendor.getId(), 1)
                .isPresent();
            if (!participatedInRound1) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.VENDOR_NOT_ELIGIBLE,
                    "Only vendors who submitted a bid in Round 1 are allowed to bid in Round 2");
            }
        }

        Instant now = Instant.now();

        TradeBid bid = tradeBidRepository
            .findByTrade_IdAndVendor_IdAndRoundNumber(tradeId, vendor.getId(), trade.getCurrentRound())
            .orElse(TradeBid.builder()
                .trade(trade)
                .vendor(vendor)
                .roundNumber(trade.getCurrentRound())
                .submittedAt(now)
                .build());

        bid.setBidAmount(request.bidAmount());
        bid.setAirlines(request.airlines());
        bid.setRouting(request.routing());
        bid.setComments(request.comments());
        bid.setIhcInr(request.ihcInr());
        bid.setThcInr(request.thcInr());
        bid.setCfsInr(request.cfsInr());
        bid.setOtherChargesComments(request.otherChargesComments());
        bid.setUpdatedAt(now);
        tradeBidRepository.save(bid);

        emailService.sendTradeBidSubmissionConfirmation(
            vendor.getEmail(),
            trade.getTradeId(),
            trade.getCurrentRound(),
            frontendBaseUrl + "/trades/" + tradeId);
        return new MessageResponse("Bid submitted successfully.");
        }

    @Transactional
    public List<String> autoCloseDueTrades() {
        Instant now = Instant.now();
        List<Trade> dueTrades = tradeRepository
            .findByBiddingOpenTrueAndClosedAtIsNullAndAutoCloseAtLessThanEqual(now);

        List<String> closedTradeIds = new ArrayList<>();
        for (Trade trade : dueTrades) {
            try {
                closeCurrentRound(trade);
                sendAutoCloseNotifications(trade);
                closedTradeIds.add(trade.getTradeId());
            } catch (Exception ignored) {
                // Scheduler will retry on the next tick.
            }
        }

        return closedTradeIds;
    }

        @Transactional(readOnly = true)
        public List<TradeBidRankResponse> getTopThreeBids(UUID tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));
        return buildLeaderboard(trade, true);
        }

    @Transactional(readOnly = true)
    public TradeBidBoardResponse getBidBoard(UUID tradeId) {
        AppUser currentUser = resolveCurrentUser();
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        if (hasRole(currentUser, RoleName.ADMIN) || hasRole(currentUser, RoleName.EXECUTIVE)) {
            boolean isAdmin = hasRole(currentUser, RoleName.ADMIN);
            // ADMIN always sees vendor identity; EXECUTIVE always sees only rates
            boolean hideIdentity = !isAdmin;
            List<TradeBidRankResponse> leaderboard = buildLeaderboard(trade, hideIdentity);
            List<TradeBidRankResponse> leaderboardRound1 = buildLeaderboard(trade, 1, hideIdentity);
            BigDecimal usdRate = trade.getMode() == TradeMode.SEA ? exchangeRateService.getUsdToInrRate() : null;
            List<TradeBidEntryResponse> entries = tradeBidRepository
                    .findByTrade_IdOrderByRoundNumberAscBidAmountAscUpdatedAtAsc(tradeId).stream()
                    .map(bid -> isAdmin ? toBidEntry(bid, usdRate) : toBidEntryAnonymous(bid, usdRate))
                    .toList();

            return new TradeBidBoardResponse(
                trade.getId(),
                trade.isBiddingOpen(),
                trade.getCurrentRound(),
                trade.getFinalL1Rate(),
                null,
                leaderboard,
                leaderboardRound1,
                entries);
        }

        Vendor vendor = resolveCurrentVendor();
        boolean hasParticipation = tradeBidRepository.existsByTrade_IdAndVendor_Id(tradeId, vendor.getId());
        if (!trade.isBiddingOpen() && !hasParticipation) {
            throw new BusinessException(HttpStatus.FORBIDDEN, ErrorCode.VENDOR_NOT_ELIGIBLE,
                "Vendors can only view tenders they participated in");
        }

        BigDecimal myCurrentBid = tradeBidRepository
            .findByTrade_IdAndVendor_IdAndRoundNumber(tradeId, vendor.getId(), trade.getCurrentRound())
            .map(TradeBid::getBidAmount)
            .orElse(null);

        List<TradeBidEntryResponse> myEntries = tradeBidRepository
            .findByTrade_IdAndVendor_IdOrderByRoundNumberAscUpdatedAtDesc(tradeId, vendor.getId())
            .stream()
            .map(b -> new TradeBidEntryResponse(
                b.getRoundNumber(),
                null,
                null,
                b.getBidAmount(),
                b.getAirlines(),
                b.getRouting(),
                b.getComments(),
                b.getIhcInr(),
                b.getThcInr(),
                b.getCfsInr(),
                b.getOtherChargesComments(),
                b.getUpdatedAt(),
                null))
            .toList();

        return new TradeBidBoardResponse(
            trade.getId(),
            trade.isBiddingOpen(),
            trade.getCurrentRound(),
            trade.getFinalL1Rate(),
            myCurrentBid,
            List.of(),
            List.of(),
            myEntries);
    }

    @Transactional
    public MessageResponse closeRound(UUID tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        closeCurrentRound(trade);

        if (trade.getCurrentRound() >= 2) {
            return new MessageResponse("Round 2 closed successfully. You can now finalize the trade.");
        }

        return new MessageResponse("Round 1 closed successfully. You can now start round 2 or finalize the trade.");
    }

    @Transactional
    public MessageResponse closeBid(UUID tradeId, UUID winnerBidId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        if (trade.getClosedAt() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Trade is already closed");
        }

        if (trade.isBiddingOpen()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_ROUND_STILL_OPEN,
                "Close current round first, then close trade");
        }

        TradeBid winningBid = tradeBidRepository.findById(winnerBidId)
            .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BID_NOT_FOUND,
                "Selected winner bid not found"));

        if (!winningBid.getTrade().getId().equals(tradeId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BID_NOT_FOUND,
                "Selected bid does not belong to this trade");
        }

        if (winningBid.getRoundNumber() > trade.getCurrentRound()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BID_NOT_FOUND,
                "Selected bid is not from a valid round");
        }

        trade.setClosedAt(Instant.now());
        trade.setFinalL1Rate(winningBid.getBidAmount());
        trade.setBiddingOpen(false);
        tradeRepository.save(trade);

        emailService.sendTradeBidWinnerNotification(
            winningBid.getVendor().getEmail(),
            winningBid.getVendor().getName(),
            trade.getTradeId(),
            trade.getDescription(),
            winningBid.getBidAmount());

        List<String> adminRecipients = appUserRepository.findDistinctByRoles_Name(RoleName.ADMIN).stream()
            .map(AppUser::getEmail)
            .filter(email -> email != null && !email.isBlank())
            .toList();

        if (!adminRecipients.isEmpty()) {
            String roundSummaryHtml = buildRoundSummaryHtml(tradeId);
            emailService.sendTradeBidFinalSummaryToAdmins(
                adminRecipients,
                trade.getTradeId(),
                trade.getDescription(),
                roundSummaryHtml);
        }

        return new MessageResponse("Trade closed successfully.");
    }

    @Transactional
    public MessageResponse cancelTrade(UUID tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        if (trade.isCancelled()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_ALREADY_CANCELLED,
                "Trade is already cancelled");
        }

        if (trade.getClosedAt() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Trade is already closed");
        }

        trade.setClosedAt(Instant.now());
        trade.setBiddingOpen(false);
        trade.setCancelled(true);
        tradeRepository.save(trade);

        return new MessageResponse("Trade cancelled successfully.");
    }

    @Transactional
    public MessageResponse reopenBid(UUID tradeId) {
        return startNextRound(tradeId);
    }

    @Transactional
    public MessageResponse startNextRound(UUID tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        if (trade.getClosedAt() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Trade is already closed");
        }

        if (trade.isBiddingOpen()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_OPEN,
                "Current round is still open");
        }

        if (trade.getCurrentRound() >= 2) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Round 2 is the final round. Please finalize the trade instead.");
        }

        int previousRoundNumber = trade.getCurrentRound();
        BigDecimal previousRoundL1Bid = trade.getFinalL1Rate();

        trade.setBiddingOpen(true);
        trade.setCurrentRound(trade.getCurrentRound() + 1);
        trade.setAutoCloseAt(calculateAutoCloseAt(Instant.now()));
        tradeRepository.save(trade);

        List<String> participantEmails = tradeBidRepository.findDistinctParticipantEmailsByTradeId(tradeId);
        String detailsUrl = frontendBaseUrl + "/trades/" + tradeId;
        emailService.sendTradeBidReopenedNotification(
            participantEmails,
            trade.getTradeId(),
            trade.getCurrentRound(),
            previousRoundNumber,
            previousRoundL1Bid,
            detailsUrl);

        return new MessageResponse("Round " + trade.getCurrentRound() + " started successfully.");
    }

    private TradeBid closeCurrentRound(Trade trade) {
        if (trade.getClosedAt() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Trade is already closed");
        }

        if (!trade.isBiddingOpen()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Current round is already closed");
        }

        TradeBid roundL1Bid = tradeBidRepository
            .findFirstByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(trade.getId(), trade.getCurrentRound())
            .orElse(null);

        trade.setBiddingOpen(false);
        trade.setFinalL1Rate(roundL1Bid == null ? null : roundL1Bid.getBidAmount());
        tradeRepository.save(trade);
        return roundL1Bid;
    }

    private void sendAutoCloseNotifications(Trade trade) {
        List<String> recipients = new ArrayList<>();
        recipients.addAll(appUserRepository.findDistinctByRoles_Name(RoleName.ADMIN).stream()
            .map(AppUser::getEmail)
            .filter(email -> email != null && !email.isBlank())
            .toList());
        recipients.addAll(appUserRepository.findDistinctByRoles_Name(RoleName.EXECUTIVE).stream()
            .map(AppUser::getEmail)
            .filter(email -> email != null && !email.isBlank())
            .toList());
        recipients.addAll(tradeBidRepository.findDistinctParticipantEmailsByTradeId(trade.getId()));

        List<String> uniqueRecipients = recipients.stream()
            .filter(email -> email != null && !email.isBlank())
            .collect(java.util.stream.Collectors.collectingAndThen(
                java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                List::copyOf));

        if (!uniqueRecipients.isEmpty()) {
            String detailsUrl = frontendBaseUrl + "/trades/" + trade.getId();
            emailService.sendTradeRoundClosedNotification(
                uniqueRecipients,
                trade.getTradeId(),
                trade.getDescription(),
                trade.getCurrentRound(),
                trade.getFinalL1Rate(),
                detailsUrl);
        }
    }

    private Instant calculateAutoCloseAt(Instant createdAt) {
        ZoneId zoneId = ZoneId.of(tradeAutoCloseZone);
        ZonedDateTime createdDateTime = createdAt.atZone(zoneId);
        ZonedDateTime nextDayClose = createdDateTime.toLocalDate()
            .plusDays(1)
            .atTime(LocalTime.of(tradeAutoCloseHour, 0))
            .atZone(zoneId);

        if (!nextDayClose.isAfter(createdDateTime)) {
            nextDayClose = nextDayClose.plusDays(1);
        }

        return nextDayClose.toInstant();
    }

        private List<String> resolveNotificationRecipients(CreateTradeRequest request) {
        TradeNotificationScope scope = request.notificationScope();

        if (scope == TradeNotificationScope.SELECTED) {
            List<UUID> vendorIds = request.vendorIds();
            if (vendorIds == null || vendorIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_NOTIFICATION_INVALID_SELECTION,
                "Please provide vendorIds when notificationScope is SELECTED");
            }

            List<Vendor> selectedVendors = vendorRepository.findByIdIn(vendorIds);
            if (selectedVendors.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_NOTIFICATION_INVALID_SELECTION,
                "No valid vendors found for the provided vendorIds");
            }

            return selectedVendors.stream()
                .map(Vendor::getEmail)
                .filter(email -> email != null && !email.isBlank())
                .collect(java.util.stream.Collectors.collectingAndThen(
                    java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                    List::copyOf));
        }

        if (scope == TradeNotificationScope.ALL_ACTIVE) {
            return vendorRepository.findByActiveTrue().stream()
                .map(Vendor::getEmail)
                .filter(email -> email != null && !email.isBlank())
                .collect(java.util.stream.Collectors.collectingAndThen(
                    java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                    List::copyOf));
        }

        return vendorRepository.findAll().stream()
            .map(Vendor::getEmail)
            .filter(email -> email != null && !email.isBlank())
            .collect(java.util.stream.Collectors.collectingAndThen(
                java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                List::copyOf));
        }

    @Transactional(readOnly = true)
    public Page<TradeResponse> getAllTrades(Pageable pageable, String query, TradeMode mode, String status) {
        AppUser currentUser = resolveCurrentUser();
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        String normalizedStatus = status == null || status.isBlank() ? "ALL" : status.trim().toUpperCase(Locale.ROOT);

        if (hasRole(currentUser, RoleName.VENDOR)) {
            Vendor vendor = resolveCurrentVendor();
            return tradeRepository.searchTradesForVendor(vendor.getId(), normalizedQuery, mode, normalizedStatus, pageable)
                .map(this::toResponse);
        }
        return tradeRepository.searchAllTrades(normalizedQuery, mode, normalizedStatus, pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TradeResponse getTradeById(UUID id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                        "Trade not found"));
        return toResponse(trade);
    }

    @Transactional(readOnly = true)
    public Resource getTradePdfForView(UUID id) {
        return getJobSheetPdfForView(id);
    }

    @Transactional(readOnly = true)
    public Resource getJobSheetPdfForView(UUID id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                        "Trade not found"));
        return fileStorageService.getFile(trade.getJobSheetPdfPath());
    }

    @Transactional(readOnly = true)
    public Resource getTrackingListPdfForView(UUID id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                        "Trade not found"));
        return fileStorageService.getFile(trade.getTrackingListPdfPath());
    }

    @Transactional(readOnly = true)
    public byte[] getTradePdfForDownload(UUID id) {
        return getJobSheetPdfForDownload(id);
    }

    @Transactional(readOnly = true)
    public byte[] getJobSheetPdfForDownload(UUID id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                        "Trade not found"));

        byte[] sourceBytes = fileStorageService.getFileBytes(trade.getJobSheetPdfPath());

        String watermarkText = resolveWatermarkText();

        return pdfWatermarkService.applyWatermark(sourceBytes, watermarkText);
    }

    @Transactional(readOnly = true)
    public byte[] getTrackingListPdfForDownload(UUID id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                        "Trade not found"));

        byte[] sourceBytes = fileStorageService.getFileBytes(trade.getTrackingListPdfPath());

        String watermarkText = resolveWatermarkText();

        return pdfWatermarkService.applyWatermark(sourceBytes, watermarkText);
    }

    private String resolveWatermarkText() {
        AppUser currentUser = resolveCurrentUser();
        String requesterEmail = currentUser.getEmail();

        Vendor vendor = vendorRepository.findByEmail(requesterEmail).orElse(null);
        if (vendor != null) {
            return (vendor.getName() + " | " + vendor.getCompanyName()).toUpperCase(Locale.ROOT);
        }
        return requesterEmail.toUpperCase(Locale.ROOT);
    }

    private AppUser resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Unauthenticated user");
        }

        return appUserRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND,
                        "Current user not found"));
    }

    private Vendor resolveCurrentVendor() {
        AppUser currentUser = resolveCurrentUser();
        Vendor vendor = vendorRepository.findByEmail(currentUser.getEmail())
                .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, ErrorCode.VENDOR_NOT_ELIGIBLE,
                        "Only active vendors can bid"));

        if (!vendor.isActive()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, ErrorCode.VENDOR_NOT_ELIGIBLE,
                    "Only active vendors can bid");
        }
        return vendor;
    }

    private boolean hasRole(AppUser user, RoleName roleName) {
        return user.getRoles().stream().anyMatch(role -> role.getName() == roleName);
    }

    private List<TradeBidRankResponse> buildLeaderboard(Trade trade, boolean hideVendorIdentity) {
        return buildLeaderboard(trade, trade.getCurrentRound(), hideVendorIdentity);
    }

    private List<TradeBidRankResponse> buildLeaderboard(Trade trade, int roundNumber, boolean hideVendorIdentity) {
        List<TradeBid> roundBids = tradeBidRepository
            .findByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(trade.getId(), roundNumber);

        BigDecimal usdRate = trade.getMode() == TradeMode.SEA ? exchangeRateService.getUsdToInrRate() : null;

        // For SEA trades rank by total INR estimate (ocean freight × USD rate + IHC + THC + CFS)
        if (trade.getMode() == TradeMode.SEA && usdRate != null) {
            final BigDecimal rate = usdRate;
            roundBids = roundBids.stream()
                .sorted(Comparator.comparing((TradeBid bid) -> {
                    BigDecimal total = computeSeaTotal(bid, rate);
                    return total != null ? total : BigDecimal.valueOf(Long.MAX_VALUE);
                }))
                .toList();
        }

        List<TradeBidRankResponse> leaderboard = new ArrayList<>();
        List<String> ranks = List.of("L1", "L2", "L3");
        for (int i = 0; i < Math.min(3, roundBids.size()); i++) {
            TradeBid bid = roundBids.get(i);
            leaderboard.add(new TradeBidRankResponse(
                    ranks.get(i),
                    bid.getId(),
                    bid.getBidAmount(),
                    hideVendorIdentity ? null : bid.getVendor().getName(),
                    hideVendorIdentity ? null : bid.getVendor().getCompanyName(),
                    bid.getIhcInr(),
                    bid.getThcInr(),
                    bid.getCfsInr(),
                    bid.getOtherChargesComments(),
                    computeSeaTotal(bid, usdRate)));
        }
        return leaderboard;
    }

    /** Computes total INR estimate for SEA bids: (freightUSD × usdRate) + IHC + THC + CFS. Returns null if usdRate is null or bidAmount is null. */
    private BigDecimal computeSeaTotal(TradeBid bid, BigDecimal usdRate) {
        if (usdRate == null || bid.getBidAmount() == null) return null;
        BigDecimal total = bid.getBidAmount().multiply(usdRate);
        if (bid.getIhcInr() != null) total = total.add(bid.getIhcInr());
        if (bid.getThcInr() != null) total = total.add(bid.getThcInr());
        if (bid.getCfsInr() != null) total = total.add(bid.getCfsInr());
        return total.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private boolean isFinalRound(Trade trade) {
        return trade.getCurrentRound() >= 2;
    }

    private TradeBidEntryResponse toBidEntry(TradeBid bid, BigDecimal usdRate) {
        return new TradeBidEntryResponse(
                bid.getRoundNumber(),
                bid.getVendor().getName(),
                bid.getVendor().getCompanyName(),
                bid.getBidAmount(),
                bid.getAirlines(),
                bid.getRouting(),
                bid.getComments(),
                bid.getIhcInr(),
                bid.getThcInr(),
                bid.getCfsInr(),
                bid.getOtherChargesComments(),
                bid.getUpdatedAt(),
                computeSeaTotal(bid, usdRate));
    }

    private TradeBidEntryResponse toBidEntryAnonymous(TradeBid bid, BigDecimal usdRate) {
        return new TradeBidEntryResponse(
                bid.getRoundNumber(),
                null,
                null,
                bid.getBidAmount(),
                bid.getAirlines(),
                bid.getRouting(),
                bid.getComments(),
                bid.getIhcInr(),
                bid.getThcInr(),
                bid.getCfsInr(),
                bid.getOtherChargesComments(),
                bid.getUpdatedAt(),
                computeSeaTotal(bid, usdRate));
    }

    private String buildRoundSummaryHtml(UUID tradeId) {
        List<TradeBid> bids = tradeBidRepository.findByTrade_IdOrderByRoundNumberAscBidAmountAscUpdatedAtAsc(tradeId);
        if (bids.isEmpty()) {
            return "<p>No bids were submitted.</p>";
        }

        Map<Integer, List<TradeBid>> roundMap = new TreeMap<>();
        for (TradeBid bid : bids) {
            roundMap.computeIfAbsent(bid.getRoundNumber(), ignored -> new ArrayList<>()).add(bid);
        }

        StringBuilder builder = new StringBuilder();
        for (Map.Entry<Integer, List<TradeBid>> entry : roundMap.entrySet()) {
            List<TradeBid> ranked = entry.getValue().stream()
                    .sorted(Comparator.comparing(TradeBid::getBidAmount).thenComparing(TradeBid::getUpdatedAt))
                    .toList();

            builder.append("<h4 style='margin:16px 0 8px;'>Round ")
                    .append(entry.getKey())
                    .append("</h4>")
                    .append("<table style='width:100%;border-collapse:collapse;margin-bottom:14px;'>")
                    .append("<tr><th style='text-align:left;border:1px solid #d1d5db;padding:8px;'>Rank</th>")
                    .append("<th style='text-align:left;border:1px solid #d1d5db;padding:8px;'>Vendor</th>")
                    .append("<th style='text-align:left;border:1px solid #d1d5db;padding:8px;'>Company</th>")
                    .append("<th style='text-align:left;border:1px solid #d1d5db;padding:8px;'>Rate</th></tr>");

            for (int i = 0; i < ranked.size(); i++) {
                TradeBid bid = ranked.get(i);
                String rank = i == 0 ? "L1" : i == 1 ? "L2" : i == 2 ? "L3" : "-";
                builder.append("<tr><td style='border:1px solid #d1d5db;padding:8px;'>")
                        .append(rank)
                        .append("</td><td style='border:1px solid #d1d5db;padding:8px;'>")
                        .append(bid.getVendor().getName())
                        .append("</td><td style='border:1px solid #d1d5db;padding:8px;'>")
                        .append(bid.getVendor().getCompanyName())
                        .append("</td><td style='border:1px solid #d1d5db;padding:8px;'>")
                        .append(bid.getBidAmount())
                        .append("</td></tr>");
            }
            builder.append("</table>");
        }

        return builder.toString();
    }

    private TradeResponse toResponse(Trade trade) {
        return new TradeResponse(
                trade.getId(),
                trade.getTradeId(),
                trade.getMode(),
                trade.getDescription(),
                trade.getJobSheetPdfPath(),
                trade.getTrackingListPdfPath(),
                trade.isBiddingOpen(),
                trade.getCurrentRound(),
                trade.getClosedAt() != null,
                trade.isCancelled(),
                trade.getFinalL1Rate(),
                trade.getCreatedAt(),
                trade.getAutoCloseAt(),
                trade.getCreatedBy() != null ? trade.getCreatedBy().getEmail() : null);
    }

    private String toDisplayMode(TradeMode mode) {
        if (mode == null) {
            return "N/A";
        }
        return switch (mode) {
            case AIR -> "Air";
            case SEA -> "Sea";
        };
    }

    @Transactional(readOnly = true)
    public TradeStatsResponse getTradeStats() {
        long total = tradeRepository.count();
        long air = tradeRepository.countByMode(TradeMode.AIR);
        long sea = tradeRepository.countByMode(TradeMode.SEA);
        return new TradeStatsResponse(total, air, sea);
    }

    @Transactional(readOnly = true)
    public List<TradeReportResponse> getTradeReport(TradeMode mode, Instant start, Instant end) {
        List<Trade> trades = tradeRepository.findReportTrades(mode, start, end);
        BigDecimal usdRate = mode == TradeMode.SEA ? exchangeRateService.getUsdToInrRate() : null;

        List<TradeReportResponse> report = new ArrayList<>();
        for (Trade t : trades) {
            String status = t.isCancelled() ? "CANCELLED" : t.getClosedAt() != null ? "FINALIZED" : t.isBiddingOpen() ? "OPEN" : "ROUND_CLOSED";
            
            String winnerVendorName = null;
            String winnerCompanyName = null;
            BigDecimal totalAmount = null;

            if (t.getClosedAt() != null && t.getFinalL1Rate() != null) {
                List<TradeBid> bids = tradeBidRepository.findByTrade_IdOrderByRoundNumberAscBidAmountAscUpdatedAtAsc(t.getId());
                TradeBid winningBid = bids.stream()
                    .filter(bid -> bid.getBidAmount() != null && bid.getBidAmount().compareTo(t.getFinalL1Rate()) == 0)
                    .findFirst()
                    .orElse(null);

                if (winningBid != null) {
                    winnerVendorName = winningBid.getVendor().getName();
                    winnerCompanyName = winningBid.getVendor().getCompanyName();
                    if (t.getMode() == TradeMode.SEA) {
                        totalAmount = computeSeaTotal(winningBid, usdRate);
                    } else {
                        totalAmount = winningBid.getBidAmount();
                    }
                }
            }

            String weight = extractWeight(t.getDescription());

            report.add(new TradeReportResponse(
                t.getId(),
                t.getTradeId(),
                t.getMode().name(),
                t.getCreatedAt(),
                t.getClosedAt(),
                status,
                t.getDescription(),
                t.getFinalL1Rate(),
                winnerVendorName,
                winnerCompanyName,
                totalAmount,
                weight
            ));
        }
        return report;
    }

    private String extractWeight(String description) {
        if (description == null) return "";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)(\\d+(?:\\.\\d+)?)\\s*(kg|kgs|ton|tons|ctr|ctrs|container|containers)");
        java.util.regex.Matcher matcher = pattern.matcher(description);
        if (matcher.find()) {
            return matcher.group(1) + " " + matcher.group(2);
        }
        return "N/A";
    }
}
