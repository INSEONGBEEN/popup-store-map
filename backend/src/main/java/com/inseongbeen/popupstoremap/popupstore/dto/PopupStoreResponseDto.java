package com.inseongbeen.popupstoremap.popupstore.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.PopupEngagementDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewSummaryDto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "팝업스토어 조회 응답")
public record PopupStoreResponseDto(
        @Schema(description = "팝업스토어 ID", example = "1") Long id,
        @Schema(description = "팝업스토어 이름", example = "성수 캐릭터 팝업") String name,
        @Schema(description = "팝업스토어 주소", example = "서울특별시 성동구 연무장길 10") String address,
        @Schema(description = "위도", example = "37.5432") Double latitude,
        @Schema(description = "경도", example = "127.0557") Double longitude,
        @Schema(description = "운영 시작일", example = "2026-07-21") LocalDate startDate,
        @Schema(description = "운영 종료일", example = "2026-08-10") LocalDate endDate,
        @Schema(description = "카테고리", example = "FASHION") PopupStoreCategory category,
        @Schema(description = "운영 상태", example = "OPEN") PopupStoreStatus status,
        @Schema(description = "팝업스토어 설명") String description,
        @Schema(description = "대표 이미지 URL") String imageUrl,
        @Schema(description = "등록 시각", example = "2026-07-21T22:20:00") LocalDateTime createdAt,
        @Schema(description = "수정 시각", example = "2026-07-21T22:20:00") LocalDateTime updatedAt,
        @Schema(description = "참여 지표") PopupEngagementDto engagement,
        @Schema(description = "리뷰 평균과 개수") ReviewSummaryDto reviewSummary,
        @Schema(description = "로그인 사용자 개인 상태") PopupPersonalizationDto personalization
) {
    public static PopupStoreResponseDto from(PopupStore popupStore) {
        return from(popupStore, PopupEngagementDto.empty(), ReviewSummaryDto.empty(), PopupPersonalizationDto.empty());
    }

    public static PopupStoreResponseDto from(PopupStore popupStore, PopupEngagementDto engagement) {
        return from(popupStore, engagement, ReviewSummaryDto.empty(), PopupPersonalizationDto.empty());
    }

    public static PopupStoreResponseDto from(PopupStore popupStore, PopupEngagementDto engagement,
                                             ReviewSummaryDto reviewSummary) {
        return from(popupStore, engagement, reviewSummary, PopupPersonalizationDto.empty());
    }

    public static PopupStoreResponseDto from(PopupStore popupStore, PopupEngagementDto engagement,
                                             ReviewSummaryDto reviewSummary,
                                             PopupPersonalizationDto personalization) {
        return new PopupStoreResponseDto(
                popupStore.getId(),
                popupStore.getName(),
                popupStore.getAddress(),
                popupStore.getLatitude(),
                popupStore.getLongitude(),
                popupStore.getStartDate(),
                popupStore.getEndDate(),
                popupStore.getCategory(),
                popupStore.getStatus(),
                popupStore.getDescription(),
                popupStore.getImageUrl(),
                popupStore.getCreatedAt(),
                popupStore.getUpdatedAt(),
                engagement,
                reviewSummary,
                personalization
        );
    }
}
