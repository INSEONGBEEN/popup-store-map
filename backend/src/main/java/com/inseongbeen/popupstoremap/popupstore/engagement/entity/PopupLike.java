package com.inseongbeen.popupstoremap.popupstore.engagement.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "popup_like", uniqueConstraints = @UniqueConstraint(
        name = "uk_popup_like_visitor",
        columnNames = {"popup_store_id", "anonymous_visitor_id"}
))
public class PopupLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "popup_store_id", nullable = false)
    private Long popupStoreId;

    @Column(name = "anonymous_visitor_id", nullable = false, length = 64)
    private String anonymousVisitorId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PopupLike(Long popupStoreId, String anonymousVisitorId) {
        this.popupStoreId = popupStoreId;
        this.anonymousVisitorId = anonymousVisitorId;
    }
}
