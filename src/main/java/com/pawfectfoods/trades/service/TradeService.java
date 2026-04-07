package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.CreateTradeRequest;
import com.pawfectfoods.trades.dto.TradeNotificationScope;
import com.pawfectfoods.trades.dto.TradeResponse;
import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import com.pawfectfoods.trades.model.AppUser;
import com.pawfectfoods.trades.model.Trade;
import com.pawfectfoods.trades.model.Vendor;
import com.pawfectfoods.trades.repository.AppUserRepository;
import com.pawfectfoods.trades.repository.TradeRepository;
import com.pawfectfoods.trades.repository.VendorRepository;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
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

        String pdfPath = fileStorageService.saveFile(request.file());
        AppUser createdBy = resolveCurrentUser();

        Trade trade = Trade.builder()
                .tradeId(request.tradeId())
                .mode(request.mode())
                .description(request.description())
                .pdfPath(pdfPath)
                .createdAt(Instant.now())
                .createdBy(createdBy)
                .build();

        Trade savedTrade = tradeRepository.save(trade);

        List<String> recipients = resolveNotificationRecipients(request);
        String detailsUrl = frontendBaseUrl + "/trades/" + savedTrade.getId();

        emailService.sendTradeCreatedNotification(
                recipients,
                savedTrade.getTradeId(),
                savedTrade.getDescription(),
                savedTrade.getMode().name(),
                detailsUrl);

        return toResponse(savedTrade);
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
                Trade trade = tradeRepository.findById(id)
                                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                                                "Trade not found"));
                return fileStorageService.getFile(trade.getPdfPath());
        }

        @Transactional(readOnly = true)
        public byte[] getTradePdfForDownload(UUID id) {
                Trade trade = tradeRepository.findById(id)
                                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.TRADE_NOT_FOUND,
                                                "Trade not found"));

                byte[] sourceBytes = fileStorageService.getFileBytes(trade.getPdfPath());

                String requesterEmail = resolveCurrentUser().getEmail();
                Vendor vendor = vendorRepository.findByEmail(requesterEmail).orElse(null);
                String watermarkText;
                if (vendor != null) {
                        watermarkText = (vendor.getName() + " | " + vendor.getCompanyName()).toUpperCase(Locale.ROOT);
                } else {
                        watermarkText = requesterEmail.toUpperCase(Locale.ROOT);
                }

                return pdfWatermarkService.applyWatermark(sourceBytes, watermarkText);
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

    private TradeResponse toResponse(Trade trade) {
        return new TradeResponse(
                trade.getId(),
                trade.getTradeId(),
                trade.getMode(),
                trade.getDescription(),
                trade.getPdfPath(),
                trade.getCreatedAt(),
                trade.getCreatedBy().getEmail());
    }
}
