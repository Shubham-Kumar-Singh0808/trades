package com.pawfectfoods.trades.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "vendor_profile_change_request")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorProfileChangeRequest {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(nullable = false, length = 100)
    private String requestedName;

    @Column(nullable = false, length = 150)
    private String requestedEmail;

    @Column(nullable = false, length = 500)
    private String requestedOfficeAddress;

    @Column(nullable = false, length = 100)
    private String contact1Name;

    @Column(nullable = false, length = 100)
    private String contact1Designation;

    @Column(nullable = false, length = 150)
    private String contact1Email;

    @Column(nullable = false, length = 20)
    private String contact1Phone;

    @Column(nullable = false, length = 100)
    private String contact2Name;

    @Column(nullable = false, length = 100)
    private String contact2Designation;

    @Column(nullable = false, length = 150)
    private String contact2Email;

    @Column(nullable = false, length = 20)
    private String contact2Phone;

    @Column(nullable = false, length = 100)
    private String contact3Name;

    @Column(nullable = false, length = 100)
    private String contact3Designation;

    @Column(nullable = false, length = 150)
    private String contact3Email;

    @Column(nullable = false, length = 20)
    private String contact3Phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalStatus status;

    @Column(nullable = false)
    private Instant requestedAt;

    @Column(length = 150)
    private String requestedBy;

    @Column(length = 150)
    private String reviewedBy;

    private Instant reviewedAt;

    @Column(length = 300)
    private String reviewRemarks;
}
