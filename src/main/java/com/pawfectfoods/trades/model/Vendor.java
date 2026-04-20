package com.pawfectfoods.trades.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "vendor", indexes = {
    @Index(name = "idx_vendor_email", columnList = "email"),
    @Index(name = "idx_vendor_gst_no", columnList = "gstNo"),
    @Index(name = "idx_vendor_status", columnList = "registrationStatus")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vendor {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String companyName;

    @Column(unique = true, length = 15)
    private String gstNo;

    @Column(length = 500)
    private String registeredAddress;

    @Column(length = 50)
    private String gstStatus;

    private Boolean gstActive;

    @Column(length = 500)
    private String officeAddress;

    @Column(nullable = false)
    private String mobileNo;

    @Column(nullable = false, unique = true)
    private String email;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VendorStatus registrationStatus = VendorStatus.APPROVED;

    @Builder.Default
    private Boolean executiveApproved = Boolean.FALSE;

    private Instant executiveApprovedAt;

    @Column(length = 150)
    private String executiveApprovedBy;

    private Instant approvedAt;

    @Column(length = 150)
    private String approvedBy;

    @Column(length = 300)
    private String rejectionReason;

    private String pendingPasswordHash;

    @Column(nullable = false)
    private Instant createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<VendorContactPerson> contactPersons = new ArrayList<>();
}
