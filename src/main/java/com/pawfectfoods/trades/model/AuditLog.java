package com.pawfectfoods.trades.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
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
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_logs_username", columnList = "username"),
        @Index(name = "idx_audit_logs_endpoint", columnList = "endpoint"),
        @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_logs_status_code", columnList = "statusCode")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String endpoint;

    @Column(nullable = false)
    private String httpMethod;

    @Column(length = 500)
    private String actionMessage;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private int statusCode;
}