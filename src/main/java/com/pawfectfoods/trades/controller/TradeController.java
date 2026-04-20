package com.pawfectfoods.trades.controller;

import com.pawfectfoods.trades.dto.CreateTradeRequest;
import com.pawfectfoods.trades.dto.BidSubmitRequest;
import com.pawfectfoods.trades.dto.MessageResponse;
import com.pawfectfoods.trades.dto.TradeBidBoardResponse;
import com.pawfectfoods.trades.dto.TradeBidRankResponse;
import com.pawfectfoods.trades.dto.TradeResponse;
import com.pawfectfoods.trades.service.TradeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<TradeResponse> createTrade(@Valid @ModelAttribute CreateTradeRequest request) {
        return ResponseEntity.ok(tradeService.createTrade(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<Page<TradeResponse>> getAllTrades(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(tradeService.getAllTrades(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<TradeResponse> getTradeById(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.getTradeById(id));
    }

    @PostMapping("/{id}/bids")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<MessageResponse> submitBid(@PathVariable UUID id, @Valid @RequestBody BidSubmitRequest request) {
        return ResponseEntity.ok(tradeService.submitBid(id, request));
    }

    @GetMapping("/{id}/bids/top3")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<List<TradeBidRankResponse>> getTopThreeBids(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.getTopThreeBids(id));
    }

    @GetMapping("/{id}/bids/board")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<TradeBidBoardResponse> getBidBoard(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.getBidBoard(id));
    }

    @PatchMapping("/{id}/bids/close")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<MessageResponse> closeBid(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.closeBid(id));
    }

    @PatchMapping("/{id}/bids/round/close")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<MessageResponse> closeRound(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.closeRound(id));
    }

    @PatchMapping("/{id}/bids/next-round")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<MessageResponse> startNextRound(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.startNextRound(id));
    }

    @PatchMapping("/{id}/bids/reopen")
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE')")
    public ResponseEntity<MessageResponse> reopenBid(@PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.reopenBid(id));
    }
    
    @GetMapping(value = "/{id}/view", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<Resource> viewTradePdf(@PathVariable UUID id) {
        Resource resource = tradeService.getJobSheetPdfForView(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.inline().filename("trade-" + id + "-job-sheet.pdf").build().toString())
                .body(resource);
    }
    
    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<byte[]> downloadTradePdf(@PathVariable UUID id) {
        byte[] bytes = tradeService.getJobSheetPdfForDownload(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename("trade-" + id + "-job-sheet.pdf").build().toString())
                .body(bytes);
    }

        @GetMapping(value = "/{id}/job-sheet/view", produces = MediaType.APPLICATION_PDF_VALUE)
        @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
        public ResponseEntity<Resource> viewJobSheetPdf(@PathVariable UUID id) {
        Resource resource = tradeService.getJobSheetPdfForView(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.inline().filename("trade-" + id + "-job-sheet.pdf").build().toString())
            .body(resource);
        }

        @GetMapping(value = "/{id}/job-sheet/download", produces = MediaType.APPLICATION_PDF_VALUE)
        @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
        public ResponseEntity<byte[]> downloadJobSheetPdf(@PathVariable UUID id) {
        byte[] bytes = tradeService.getJobSheetPdfForDownload(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename("trade-" + id + "-job-sheet.pdf").build().toString())
            .body(bytes);
        }

        @GetMapping(value = {"/{id}/tracking-list/view", "/{id}/packing-list/view"}, produces = MediaType.APPLICATION_PDF_VALUE)
        @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
        public ResponseEntity<Resource> viewTrackingListPdf(@PathVariable UUID id) {
        Resource resource = tradeService.getTrackingListPdfForView(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.inline().filename("trade-" + id + "-packing-list.pdf").build().toString())
            .body(resource);
        }

        @GetMapping(value = {"/{id}/tracking-list/download", "/{id}/packing-list/download"}, produces = MediaType.APPLICATION_PDF_VALUE)
        @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
        public ResponseEntity<byte[]> downloadTrackingListPdf(@PathVariable UUID id) {
        byte[] bytes = tradeService.getTrackingListPdfForDownload(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename("trade-" + id + "-packing-list.pdf").build().toString())
            .body(bytes);
        }
}
