package com.inseongbeen.popupstoremap.review.dto;

import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.review.entity.PopupReview;

public record MyReviewResponseDto(PopupStoreResponseDto popupStore, ReviewResponseDto review) {
    public static MyReviewResponseDto from(PopupReview review, boolean verified) {
        return new MyReviewResponseDto(PopupStoreResponseDto.from(review.getPopupStore()),
                ReviewResponseDto.from(review, verified, true));
    }
}
