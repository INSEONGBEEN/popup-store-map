package com.inseongbeen.popupstoremap.popupstore.engagement.dto;

import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupEngagementSummary;

public record PopupEngagementDto(
        long viewCount,
        long likeCount,
        long planAddCount,
        boolean likedByCurrentVisitor
) {
    public static PopupEngagementDto empty() {
        return new PopupEngagementDto(0, 0, 0, false);
    }

    public static PopupEngagementDto from(PopupEngagementSummary summary, boolean liked) {
        if (summary == null) return new PopupEngagementDto(0, 0, 0, liked);
        return new PopupEngagementDto(
                summary.getViewCount(),
                summary.getLikeCount(),
                summary.getPlanAddCount(),
                liked
        );
    }
}
