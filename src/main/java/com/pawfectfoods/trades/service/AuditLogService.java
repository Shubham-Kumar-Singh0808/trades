package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.model.AuditLog;
import com.pawfectfoods.trades.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void save(AuditLog auditLog) {
        auditLogRepository.save(auditLog);
    }
}
