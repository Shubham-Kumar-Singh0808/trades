package com.pawfectfoods.trades.dto;

import com.pawfectfoods.trades.model.TradeMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public record CreateTradeRequest(
        @NotBlank @Size(max = 50) String tradeId,
        @NotNull TradeMode mode,
        @NotBlank @Size(max = 1000) String description,
        @NotNull TradeNotificationScope notificationScope,
        List<UUID> vendorIds,
        @NotNull MultipartFile file
) {
}
