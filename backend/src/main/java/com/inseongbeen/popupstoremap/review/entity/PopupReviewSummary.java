package com.inseongbeen.popupstoremap.review.entity;

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
@Table(name = "popup_review_summary")
public class PopupReviewSummary {
    @Id
    @Column(name = "popup_store_id")
    private Long popupStoreId;

    @Column(name = "rating_sum", nullable = false)
    private long ratingSum;

    @Column(name = "review_count", nullable = false)
    private long reviewCount;

    @Column(name = "average_rating", nullable = false)
    private double averageRating;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PopupReviewSummary(Long popupStoreId) { this.popupStoreId = popupStoreId; }

    public void add(int rating) { ratingSum += rating; reviewCount++; recalculate(); }
    public void replace(int previous, int next) { ratingSum += next - previous; recalculate(); }
    public void remove(int rating) { ratingSum = Math.max(0, ratingSum - rating); reviewCount = Math.max(0, reviewCount - 1); recalculate(); }
    private void recalculate() { averageRating = reviewCount == 0 ? 0 : (double) ratingSum / reviewCount; }
}
