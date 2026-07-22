package com.inseongbeen.popupstoremap.review.dto;

import com.inseongbeen.popupstoremap.review.entity.PopupReviewSummary;

public record ReviewSummaryDto(double averageRating, long reviewCount) {
    public static ReviewSummaryDto empty() { return new ReviewSummaryDto(0, 0); }
    public static ReviewSummaryDto from(PopupReviewSummary summary) {
        return summary == null ? empty() : new ReviewSummaryDto(summary.getAverageRating(), summary.getReviewCount());
    }
}
