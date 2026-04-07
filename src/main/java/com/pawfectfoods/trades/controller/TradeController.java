package com.pawfectfoods.trades.controller;

import com.pawfectfoods.trades.dto.CreateTradeRequest;
import com.pawfectfoods.trades.dto.TradeResponse;
import com.pawfectfoods.trades.service.TradeService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    
    @GetMapping(value = "/{id}/view", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<Resource> viewTradePdf(@PathVariable UUID id) {
        Resource resource = tradeService.getTradePdfForView(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename("trade-" + id + ".pdf").build().toString())
                .body(resource);
    }
    
    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','EXECUTIVE','VENDOR')")
    public ResponseEntity<byte[]> downloadTradePdf(@PathVariable UUID id) {
        byte[] bytes = tradeService.getTradePdfForDownload(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("trade-" + id + ".pdf").build().toString())
                .body(bytes);
    }
}
