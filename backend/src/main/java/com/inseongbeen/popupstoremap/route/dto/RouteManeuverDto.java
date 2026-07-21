package com.inseongbeen.popupstoremap.route.dto;

import java.util.List;

public record RouteManeuverDto(
        String instruction,
        int maneuverType,
        double distanceMeters,
        double durationSeconds,
        List<String> streetNames,
        int beginShapeIndex,
        int endShapeIndex
) {
}
