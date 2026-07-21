package com.inseongbeen.popupstoremap.route.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PedestrianRouteOptimizationRequestDto(
        @NotNull @Valid RouteCoordinateDto origin,
        @NotNull @Size(min = 2, max = 8) List<@Valid RouteOptimizationDestinationDto> destinations,
        @Pattern(regexp = "(?i)time|distance") String costType
) {
}
