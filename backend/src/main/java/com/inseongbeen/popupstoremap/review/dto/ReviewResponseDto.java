package com.inseongbeen.popupstoremap.review.dto;

import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.review.entity.PopupReview;

public record ReviewResponseDto(
        Long reviewId,
        String nickname,
        int rating,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean verifiedVisit,
        boolean mine
) {
    public static ReviewResponseDto from(PopupReview review, boolean verifiedVisit, boolean mine) {
        return new ReviewResponseDto(review.getId(), review.getUser().getNickname(), review.getRating(),
                review.getContent(), review.getCreatedAt(), review.getUpdatedAt(), verifiedVisit, mine);
    }
}
