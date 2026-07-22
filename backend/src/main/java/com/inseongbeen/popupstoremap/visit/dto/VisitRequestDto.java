package com.inseongbeen.popupstoremap.visit.dto;

import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.visit.entity.VisitSource;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VisitRequestDto(
        @NotNull VisitSource source,
        LocalDateTime visitedAt,
        @Size(max = 64) String routeSessionId
) {
}
