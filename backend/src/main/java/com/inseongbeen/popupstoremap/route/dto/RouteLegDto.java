package com.inseongbeen.popupstoremap.route.dto;

import java.util.List;

public record RouteLegDto(
        int index,
        double distanceMeters,
        double durationSeconds,
        List<RouteManeuverDto> maneuvers
) {
}
