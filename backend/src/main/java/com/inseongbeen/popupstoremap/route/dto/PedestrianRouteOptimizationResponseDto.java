package com.inseongbeen.popupstoremap.route.dto;

import java.util.List;

public record PedestrianRouteOptimizationResponseDto(
        List<Long> originalDestinationIds,
        List<Long> orderedDestinationIds,
        List<RouteOptimizationDestinationDto> orderedLocations,
        PedestrianRouteResponseDto route,
        RouteMetricsDto original,
        RouteMetricsDto optimized,
        RouteMetricsDto savings,
        String algorithm
) {
}
