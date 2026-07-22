package com.inseongbeen.popupstoremap.visit.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.visit.entity.VisitHistory;
import com.inseongbeen.popupstoremap.visit.entity.VisitSource;

public record VisitResponseDto(
        Long id,
        PopupStoreResponseDto popupStore,
        LocalDateTime visitedAt,
        LocalDate visitDate,
        VisitSource source,
        LocalDateTime createdAt
) {
    public static VisitResponseDto from(VisitHistory visit) {
        return new VisitResponseDto(visit.getId(), PopupStoreResponseDto.from(visit.getPopupStore()),
                visit.getVisitedAt(), visit.getVisitDate(), visit.getSource(), visit.getCreatedAt());
    }
}
