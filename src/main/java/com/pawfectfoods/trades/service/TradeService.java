package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.BidSubmitRequest;
import com.pawfectfoods.trades.dto.CreateTradeRequest;
import com.pawfectfoods.trades.dto.MessageResponse;
import com.pawfectfoods.trades.dto.TradeBidBoardResponse;
import com.pawfectfoods.trades.dto.TradeBidEntryResponse;
import com.pawfectfoods.trades.dto.TradeBidRankResponse;
import com.pawfectfoods.trades.dto.TradeNotificationScope;
import com.pawfectfoods.trades.dto.TradeResponse;
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

    @Value("${app.frontend.base-url:http://localhost:4000}")
    private String frontendBaseUrl;

    @Transactional
    public TradeResponse createTrade(CreateTradeRequest request) {
        if (tradeRepository.existsByTradeId(request.tradeId())) {
            throw new BusinessException(HttpStatus.CONFLICT, ErrorCode.TRADE_ALREADY_EXISTS,
                    "Trade ID already exists");
        }

        String jobSheetPdfPath = fileStorageService.saveFile(request.jobSheetFile());
        String trackingListPdfPath = fileStorageService.saveFile(request.trackingListFile());
        AppUser createdBy = resolveCurrentUser();

        Trade trade = Trade.builder()
                .tradeId(request.tradeId())
                .mode(request.mode())
                .description(request.description())
                .jobSheetPdfPath(jobSheetPdfPath)
                .trackingListPdfPath(trackingListPdfPath)
                .createdAt(Instant.now())
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
        bid.setUpdatedAt(now);
        tradeBidRepository.save(bid);
        return new MessageResponse("Bid submitted successfully.");
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
            List<TradeBidRankResponse> leaderboard = buildLeaderboard(trade, trade.isBiddingOpen());
            List<TradeBidEntryResponse> entries = trade.isBiddingOpen()
                ? List.of()
                    : tradeBidRepository.findByTrade_IdOrderByRoundNumberAscBidAmountAscUpdatedAtAsc(tradeId).stream()
                    .map(this::toBidEntry)
                    .toList();

            return new TradeBidBoardResponse(
                trade.getId(),
                trade.isBiddingOpen(),
                trade.getCurrentRound(),
                trade.getFinalL1Rate(),
                null,
                leaderboard,
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
                b.getUpdatedAt()))
            .toList();

        return new TradeBidBoardResponse(
            trade.getId(),
            trade.isBiddingOpen(),
            trade.getCurrentRound(),
            trade.getFinalL1Rate(),
            myCurrentBid,
            List.of(),
            myEntries);
        }

        @Transactional
        public MessageResponse closeRound(UUID tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                "Trade not found"));

        if (trade.getClosedAt() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Trade is already closed");
        }

        if (!trade.isBiddingOpen()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.TRADE_BIDDING_ALREADY_CLOSED,
                "Current round is already closed");
        }

        TradeBid roundL1Bid = tradeBidRepository
            .findFirstByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(tradeId, trade.getCurrentRound())
            .orElse(null);

        trade.setBiddingOpen(false);
        trade.setFinalL1Rate(roundL1Bid == null ? null : roundL1Bid.getBidAmount());
        tradeRepository.save(trade);

        return new MessageResponse("Round " + trade.getCurrentRound()
                + " closed successfully. You can now start next round or close trade.");
        }

        @Transactional
        public MessageResponse closeBid(UUID tradeId) {
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

        TradeBid winningBid = tradeBidRepository
            .findFirstByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(tradeId, trade.getCurrentRound())
            .orElse(null);

        trade.setClosedAt(Instant.now());
        trade.setFinalL1Rate(winningBid == null ? null : winningBid.getBidAmount());
        tradeRepository.save(trade);

        if (winningBid != null) {
            emailService.sendTradeBidWinnerNotification(
                winningBid.getVendor().getEmail(),
                winningBid.getVendor().getName(),
                trade.getTradeId(),
                trade.getDescription(),
                winningBid.getBidAmount());
        }

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

        int previousRoundNumber = trade.getCurrentRound();
        BigDecimal previousRoundL1Bid = trade.getFinalL1Rate();

        trade.setBiddingOpen(true);
        trade.setCurrentRound(trade.getCurrentRound() + 1);
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
    public Page<TradeResponse> getAllTrades(Pageable pageable) {
        AppUser currentUser = resolveCurrentUser();
        if (hasRole(currentUser, RoleName.VENDOR)) {
            Vendor vendor = resolveCurrentVendor();
            return tradeRepository.findDistinctByVendorId(vendor.getId(), pageable).map(this::toResponse);
        }
        return tradeRepository.findAll(pageable).map(this::toResponse);
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
        List<TradeBid> roundBids = tradeBidRepository
            .findByTrade_IdAndRoundNumberOrderByBidAmountAscUpdatedAtAsc(trade.getId(), trade.getCurrentRound());

        List<TradeBidRankResponse> leaderboard = new ArrayList<>();
        List<String> ranks = List.of("L1", "L2", "L3");

        for (int i = 0; i < Math.min(3, roundBids.size()); i++) {
            TradeBid bid = roundBids.get(i);
            leaderboard.add(new TradeBidRankResponse(
                    ranks.get(i),
                    bid.getBidAmount(),
                    hideVendorIdentity ? null : bid.getVendor().getName(),
                    hideVendorIdentity ? null : bid.getVendor().getCompanyName()));
        }
        return leaderboard;
    }

    private TradeBidEntryResponse toBidEntry(TradeBid bid) {
        return new TradeBidEntryResponse(
                bid.getRoundNumber(),
                bid.getVendor().getName(),
                bid.getVendor().getCompanyName(),
                bid.getBidAmount(),
                bid.getUpdatedAt());
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
                trade.getFinalL1Rate(),
                trade.getCreatedAt(),
                trade.getCreatedBy().getEmail());
    }

    private String toDisplayMode(TradeMode mode) {
        if (mode == null) {
            return "N/A";
        }

        return switch (mode) {
            case ONLINE -> "DIRECT";
            case HYBRID -> "HOPPING";
            case OFFLINE -> "OFFLINE";
        };
    }
}
