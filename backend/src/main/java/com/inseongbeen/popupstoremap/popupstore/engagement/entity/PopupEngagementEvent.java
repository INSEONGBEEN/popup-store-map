package com.inseongbeen.popupstoremap.popupstore.engagement.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "popup_engagement_event", uniqueConstraints = @UniqueConstraint(
        name = "uk_popup_engagement_event_session",
        columnNames = {"popup_store_id", "session_id", "event_type"}
))
public class PopupEngagementEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "popup_store_id", nullable = false)
    private Long popupStoreId;

    @Column(name = "anonymous_visitor_id", nullable = false, length = 64)
    private String anonymousVisitorId;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private EngagementEventType eventType;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    public PopupEngagementEvent(
            Long popupStoreId,
            String anonymousVisitorId,
            String sessionId,
            EngagementEventType eventType
    ) {
        this.popupStoreId = popupStoreId;
        this.anonymousVisitorId = anonymousVisitorId;
        this.sessionId = sessionId;
        this.eventType = eventType;
    }
}
