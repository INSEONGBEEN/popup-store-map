package com.inseongbeen.popupstoremap.popupstore.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;

public record PopupStoreResponseDto(
        Long id,
        String name,
        String address,
        Double latitude,
        Double longitude,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PopupStoreResponseDto from(PopupStore popupStore) {
        return new PopupStoreResponseDto(
                popupStore.getId(),
                popupStore.getName(),
                popupStore.getAddress(),
                popupStore.getLatitude(),
                popupStore.getLongitude(),
                popupStore.getStartDate(),
                popupStore.getEndDate(),
                popupStore.getDescription(),
                popupStore.getImageUrl(),
                popupStore.getCreatedAt(),
                popupStore.getUpdatedAt()
        );
    }
}
