package com.inseongbeen.popupstoremap.route.service;

import java.util.ArrayList;
import java.util.List;

import com.inseongbeen.popupstoremap.route.dto.RouteCoordinateDto;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

final class Polyline6Decoder {

    private static final double PRECISION = 1_000_000.0;

    private Polyline6Decoder() {
    }

    static List<RouteCoordinateDto> decode(String encoded) {
        if (encoded == null || encoded.isBlank()) {
            throw invalidResponse();
        }

        List<RouteCoordinateDto> coordinates = new ArrayList<>();
        int latitude = 0;
        int longitude = 0;
        int index = 0;

        try {
            while (index < encoded.length()) {
                DecodedValue latitudeValue = decodeValue(encoded, index);
                index = latitudeValue.nextIndex();
                latitude += latitudeValue.delta();

                DecodedValue longitudeValue = decodeValue(encoded, index);
                index = longitudeValue.nextIndex();
                longitude += longitudeValue.delta();

                coordinates.add(new RouteCoordinateDto(
                        longitude / PRECISION,
                        latitude / PRECISION
                ));
            }
        } catch (IndexOutOfBoundsException exception) {
            throw invalidResponse();
        }

        if (coordinates.size() < 2) {
            throw invalidResponse();
        }
        return coordinates;
    }

    private static DecodedValue decodeValue(String encoded, int startIndex) {
        int result = 0;
        int shift = 0;
        int index = startIndex;
        int value;

        do {
            if (index >= encoded.length() || shift > 30) {
                throw invalidResponse();
            }
            value = encoded.charAt(index++) - 63;
            result |= (value & 0x1f) << shift;
            shift += 5;
        } while (value >= 0x20);

        int delta = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
        return new DecodedValue(delta, index);
    }

    private static PedestrianRouteException invalidResponse() {
        return new PedestrianRouteException(
                RouteErrorType.INVALID_RESPONSE,
                "도보 경로 서비스 응답을 처리할 수 없습니다."
        );
    }

    private record DecodedValue(int delta, int nextIndex) {
    }
}
