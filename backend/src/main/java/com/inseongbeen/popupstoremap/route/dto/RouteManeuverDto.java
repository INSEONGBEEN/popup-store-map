package com.inseongbeen.popupstoremap.route.dto;

public record RouteManeuverDto(
        String instruction,
        int maneuverType,
        double distanceMeters,
        double durationSeconds
) {
}
