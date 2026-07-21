package com.inseongbeen.popupstoremap.route.dto;

import java.util.List;

public record PedestrianRouteResponseDto(
        List<RouteCoordinateDto> coordinates,
        double distanceMeters,
        double durationSeconds,
        List<RouteLegDto> legs
) {
}
