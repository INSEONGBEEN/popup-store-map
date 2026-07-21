package com.inseongbeen.popupstoremap.route.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.inseongbeen.popupstoremap.route.dto.RouteCoordinateDto;

class Polyline6DecoderTests {

    // Actual Valhalla 3.8.2 pedestrian leg shape around Seongsu, encoded as polyline6.
    private static final String SEONGSU_LEG_SHAPE =
            "sdprfAic{iqF|Ho`@~Iqe@xAqHwFiBeBk@`Ha]e[{Ksk@kQg@Oen@mS}@_@gbA}l@gd@sVkMwFoDyAi@G_@U{Bc@kCg@uAOcBURyB{A}@qOeJdFqm@rGv@JoF";

    @Test
    void decodesActualValhallaPolyline6InLongitudeLatitudeOrder() {
        var coordinates = Polyline6Decoder.decode(SEONGSU_LEG_SHAPE);

        assertThat(coordinates).hasSize(28);
        assertThat(coordinates.getFirst()).isEqualTo(new RouteCoordinateDto(127.055941, 37.544538));
        assertThat(coordinates.getLast()).isEqualTo(new RouteCoordinateDto(127.061116, 37.548453));
    }

    @Test
    void decodesSignedNegativeDeltas() {
        var coordinates = Polyline6Decoder.decode("_gjaR_gjaR~hbE~hbE");

        assertThat(coordinates).containsExactly(
                new RouteCoordinateDto(10.0, 10.0),
                new RouteCoordinateDto(9.9, 9.9)
        );
    }
}
