package com.inseongbeen.popupstoremap.route.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record RouteOptimizationDestinationDto(
        @NotNull Long id,
        @NotNull @Valid RouteCoordinateDto coordinate
) {
}
