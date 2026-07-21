package com.inseongbeen.popupstoremap.popupstore.dto;

import java.time.LocalDate;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "팝업스토어 등록 및 수정 요청")
public record PopupStoreRequestDto(
        @Schema(description = "팝업스토어 이름", example = "성수 캐릭터 팝업")
        @NotBlank String name,

        @Schema(description = "팝업스토어 주소", example = "서울특별시 성동구 연무장길 10")
        @NotBlank String address,

        @Schema(description = "위도", example = "37.5432")
        @NotNull Double latitude,

        @Schema(description = "경도", example = "127.0557")
        @NotNull Double longitude,

        @Schema(description = "운영 시작일", example = "2026-07-21")
        @NotNull LocalDate startDate,

        @Schema(description = "운영 종료일", example = "2026-08-10")
        @NotNull LocalDate endDate,

        @Schema(description = "카테고리", example = "FASHION")
        PopupStoreCategory category,

        @Schema(description = "운영 상태", example = "OPEN")
        PopupStoreStatus status,

        @Schema(description = "팝업스토어 설명", example = "성수동에서 진행되는 캐릭터 팝업스토어")
        String description,

        @Schema(description = "대표 이미지 URL", example = "https://example.com/images/popup-store.jpg")
        String imageUrl
) {
}
