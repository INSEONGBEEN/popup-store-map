package com.inseongbeen.popupstoremap.route.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PedestrianRouteRequestDto(
        @NotNull @Size(min = 2, max = 9) List<@Valid RouteCoordinateDto> coordinates
) {
}
