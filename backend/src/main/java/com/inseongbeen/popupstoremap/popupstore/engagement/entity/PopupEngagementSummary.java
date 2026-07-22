package com.inseongbeen.popupstoremap.popupstore.engagement.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "popup_engagement_summary")
public class PopupEngagementSummary {

    @Id
    @Column(name = "popup_store_id")
    private Long popupStoreId;

    @Column(nullable = false)
    private long viewCount;

    @Column(nullable = false)
    private long likeCount;

    @Column(nullable = false)
    private long planAddCount;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public PopupEngagementSummary(Long popupStoreId) {
        this.popupStoreId = popupStoreId;
    }

    public void incrementViewCount() {
        viewCount++;
    }

    public void incrementLikeCount() {
        likeCount++;
    }

    public void decrementLikeCount() {
        likeCount = Math.max(0, likeCount - 1);
    }

    public void incrementPlanAddCount() {
        planAddCount++;
    }
}
