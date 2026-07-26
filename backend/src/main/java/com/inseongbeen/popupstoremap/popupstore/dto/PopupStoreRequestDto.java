package com.inseongbeen.popupstoremap.popupstore.dto;

import java.time.LocalDate;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

@Schema(description = "팝업스토어 등록 및 수정 요청")
public record PopupStoreRequestDto(
        @Schema(description = "팝업스토어 이름", example = "성수 캐릭터 팝업")
        @NotBlank @Size(max = 100) String name,

        @Schema(description = "팝업스토어 주소", example = "서울특별시 성동구 연무장길 10")
        @NotBlank @Size(max = 255) String address,

        @Schema(description = "위도", example = "37.5432")
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,

        @Schema(description = "경도", example = "127.0557")
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,

        @Schema(description = "운영 시작일", example = "2026-07-21")
        @NotNull LocalDate startDate,

        @Schema(description = "운영 종료일", example = "2026-08-10")
        @NotNull LocalDate endDate,

        @Schema(description = "카테고리", example = "FASHION")
        PopupStoreCategory category,

        @Schema(description = "운영 상태", example = "OPEN")
        PopupStoreStatus status,

        @Schema(description = "팝업스토어 설명", example = "성수동에서 진행되는 캐릭터 팝업스토어")
        @Size(max = 10000) String description,

        @Schema(description = "대표 이미지 URL", example = "https://example.com/images/popup-store.jpg")
        @Size(max = 500) String imageUrl
) {
    @AssertTrue(message = "운영 종료일은 시작일보다 빠를 수 없습니다.")
    public boolean isOperatingDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
