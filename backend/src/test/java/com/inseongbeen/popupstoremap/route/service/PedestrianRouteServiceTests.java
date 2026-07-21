package com.inseongbeen.popupstoremap.route.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inseongbeen.popupstoremap.route.client.ValhallaClient;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteRequestDto;
import com.inseongbeen.popupstoremap.route.dto.RouteCoordinateDto;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

class PedestrianRouteServiceTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void createsPedestrianRequestInInputOrder() {
        CapturingClient client = new CapturingClient(validValhallaResponse());
        PedestrianRouteService service = new PedestrianRouteService(client);

        service.findRoute(new PedestrianRouteRequestDto(List.of(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.06, 37.55)
        )));

        assertThat(client.request.path("costing").asText()).isEqualTo("pedestrian");
        assertThat(client.request.path("shape_format").asText()).isEqualTo("polyline6");
        assertThat(client.request.path("generalize").asInt()).isZero();
        assertThat(client.request.path("locations").get(0).path("lon").asDouble()).isEqualTo(127.05);
        assertThat(client.request.path("locations").get(0).path("lat").asDouble()).isEqualTo(37.54);
        assertThat(client.request.path("locations").get(1).path("lon").asDouble()).isEqualTo(127.06);
    }

    @Test
    void transformsValhallaSummaryLegsManeuversAndShape() {
        PedestrianRouteService service = new PedestrianRouteService(request -> validValhallaResponse());

        var response = service.findRoute(new PedestrianRouteRequestDto(List.of(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.06, 37.55)
        )));

        assertThat(response.distanceMeters()).isEqualTo(1_200);
        assertThat(response.durationSeconds()).isEqualTo(900);
        assertThat(response.coordinates()).containsExactly(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.051, 37.541)
        );
        assertThat(response.legs()).hasSize(1);
        assertThat(response.legs().getFirst().maneuvers().getFirst().instruction()).isEqualTo("북쪽으로 이동하세요.");
    }

    @Test
    void rejectsMissingRouteShape() {
        PedestrianRouteService service = new PedestrianRouteService(
                request -> json("{\"trip\":{\"summary\":{\"length\":1,\"time\":1},\"legs\":[{}]}}")
        );

        assertThatThrownBy(() -> service.findRoute(new PedestrianRouteRequestDto(List.of(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.06, 37.55)
        ))))
                .isInstanceOf(PedestrianRouteException.class)
                .extracting(exception -> ((PedestrianRouteException) exception).getType())
                .isEqualTo(RouteErrorType.INVALID_RESPONSE);
    }

    @Test
    void combinesEveryDecodedLegCoordinateAndRemovesOnlyBoundaryDuplicate() {
        String firstShape = encodePolyline6(List.of(
                new double[]{37.54, 127.05},
                new double[]{37.5405, 127.0505},
                new double[]{37.541, 127.051}
        ));
        String secondShape = encodePolyline6(List.of(
                new double[]{37.541, 127.051},
                new double[]{37.5415, 127.0515},
                new double[]{37.542, 127.052}
        ));
        PedestrianRouteService service = new PedestrianRouteService(request -> json("""
                {"trip":{"summary":{"length":1.2,"time":900},"legs":[
                  {"summary":{"length":0.5,"time":300},"shape":"%s","maneuvers":[]},
                  {"summary":{"length":0.7,"time":600},"shape":"%s","maneuvers":[]}
                ]}}
                """.formatted(firstShape, secondShape)));

        var response = service.findRoute(new PedestrianRouteRequestDto(List.of(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.051, 37.541),
                new RouteCoordinateDto(127.052, 37.542)
        )));

        assertThat(response.coordinates()).containsExactly(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.0505, 37.5405),
                new RouteCoordinateDto(127.051, 37.541),
                new RouteCoordinateDto(127.0515, 37.5415),
                new RouteCoordinateDto(127.052, 37.542)
        );
    }

    @Test
    void rejectsShapeWithFewerThanTwoDecodedCoordinates() {
        String onePointShape = encodePolyline6(List.of(new double[]{37.54, 127.05}));
        PedestrianRouteService service = new PedestrianRouteService(request -> json("""
                {"trip":{"summary":{"length":1,"time":1},"legs":[{
                  "summary":{"length":1,"time":1},"shape":"%s","maneuvers":[]
                }]}}
                """.formatted(onePointShape)));

        assertThatThrownBy(() -> service.findRoute(new PedestrianRouteRequestDto(List.of(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.06, 37.55)
        ))))
                .isInstanceOf(PedestrianRouteException.class)
                .extracting(exception -> ((PedestrianRouteException) exception).getType())
                .isEqualTo(RouteErrorType.INVALID_RESPONSE);
    }

    @Test
    void preservesExternalFailureCategory() {
        PedestrianRouteService service = new PedestrianRouteService(
                request -> {
                    throw new PedestrianRouteException(
                            RouteErrorType.UPSTREAM_TIMEOUT,
                            "도보 경로 서비스 응답 시간이 초과되었습니다."
                    );
                }
        );

        assertThatThrownBy(() -> service.findRoute(new PedestrianRouteRequestDto(List.of(
                new RouteCoordinateDto(127.05, 37.54),
                new RouteCoordinateDto(127.06, 37.55)
        ))))
                .isInstanceOf(PedestrianRouteException.class)
                .extracting(exception -> ((PedestrianRouteException) exception).getType())
                .isEqualTo(RouteErrorType.UPSTREAM_TIMEOUT);
    }

    private JsonNode validValhallaResponse() {
        String shape = encodePolyline6(List.of(
                new double[]{37.54, 127.05},
                new double[]{37.541, 127.051}
        ));
        return json("""
                {"trip":{
                  "summary":{"length":1.2,"time":900},
                  "legs":[{
                    "summary":{"length":1.2,"time":900},
                    "shape":"%s",
                    "maneuvers":[{"instruction":"북쪽으로 이동하세요.","type":1,"length":1.2,"time":900}]
                  }]
                }}
                """.formatted(shape));
    }

    private JsonNode json(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String encodePolyline6(List<double[]> coordinates) {
        StringBuilder result = new StringBuilder();
        int previousLatitude = 0;
        int previousLongitude = 0;
        for (double[] coordinate : coordinates) {
            int latitude = (int) Math.round(coordinate[0] * 1_000_000);
            int longitude = (int) Math.round(coordinate[1] * 1_000_000);
            encodeValue(latitude - previousLatitude, result);
            encodeValue(longitude - previousLongitude, result);
            previousLatitude = latitude;
            previousLongitude = longitude;
        }
        return result.toString();
    }

    private void encodeValue(int value, StringBuilder result) {
        int encoded = value < 0 ? ~(value << 1) : value << 1;
        while (encoded >= 0x20) {
            result.append((char) ((0x20 | (encoded & 0x1f)) + 63));
            encoded >>= 5;
        }
        result.append((char) (encoded + 63));
    }

    private static class CapturingClient implements ValhallaClient {
        private final JsonNode response;
        private JsonNode request;

        private CapturingClient(JsonNode response) {
            this.response = response;
        }

        @Override
        public JsonNode route(JsonNode request) {
            this.request = request;
            return response;
        }
    }
}
