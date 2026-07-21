package com.inseongbeen.popupstoremap.popupstore.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PopupStoreRequestDto(
        @NotBlank String name,
        @NotBlank String address,
        @NotNull Double latitude,
        @NotNull Double longitude,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        String description,
        String imageUrl
) {
}
