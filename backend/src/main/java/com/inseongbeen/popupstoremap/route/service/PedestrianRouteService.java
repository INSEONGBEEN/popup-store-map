package com.inseongbeen.popupstoremap.route.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.inseongbeen.popupstoremap.route.client.ValhallaClient;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteRequestDto;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteResponseDto;
import com.inseongbeen.popupstoremap.route.dto.RouteCoordinateDto;
import com.inseongbeen.popupstoremap.route.dto.RouteLegDto;
import com.inseongbeen.popupstoremap.route.dto.RouteManeuverDto;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

@Service
public class PedestrianRouteService {

    private static final Logger log = LoggerFactory.getLogger(PedestrianRouteService.class);

    private final ValhallaClient valhallaClient;
    private final ObjectMapper objectMapper;

    public PedestrianRouteService(ValhallaClient valhallaClient) {
        this.valhallaClient = valhallaClient;
        this.objectMapper = new ObjectMapper();
    }

    public PedestrianRouteResponseDto findRoute(PedestrianRouteRequestDto request) {
        log.debug("Requesting pedestrian route with {} locations", request.coordinates().size());
        JsonNode response = valhallaClient.route(toValhallaRequest(request.coordinates()));
        return toResponse(response);
    }

    ObjectNode toValhallaRequest(List<RouteCoordinateDto> coordinates) {
        ObjectNode request = objectMapper.createObjectNode();
        ArrayNode locations = request.putArray("locations");
        coordinates.forEach(coordinate -> locations.addObject()
                .put("lat", coordinate.latitude())
                .put("lon", coordinate.longitude())
                .put("type", "break"));
        request.put("costing", "pedestrian");
        request.put("units", "kilometers");
        request.put("language", "ko-KR");
        request.put("directions_type", "instructions");
        request.put("shape_format", "polyline6");
        request.put("generalize", 0);
        return request;
    }

    PedestrianRouteResponseDto toResponse(JsonNode response) {
        JsonNode trip = response.path("trip");
        JsonNode summary = trip.path("summary");
        JsonNode legsNode = trip.path("legs");
        if (!trip.isObject() || !summary.isObject() || !legsNode.isArray() || legsNode.isEmpty()) {
            throw invalidResponse();
        }

        double distanceMeters = requiredNonNegativeNumber(summary, "length") * 1_000;
        double durationSeconds = requiredNonNegativeNumber(summary, "time");
        List<RouteCoordinateDto> coordinates = new ArrayList<>();
        List<RouteLegDto> legs = new ArrayList<>();
        log.debug("Valhalla returned {} legs", legsNode.size());

        for (int index = 0; index < legsNode.size(); index++) {
            JsonNode legNode = legsNode.get(index);
            String encodedShape = requiredText(legNode, "shape");
            List<RouteCoordinateDto> legCoordinates = Polyline6Decoder.decode(encodedShape);
            log.debug(
                    "Valhalla leg {} shape length={}, decoded coordinates={}",
                    index,
                    encodedShape.length(),
                    legCoordinates.size()
            );
            boolean duplicateBoundary = !coordinates.isEmpty()
                    && coordinates.getLast().equals(legCoordinates.getFirst());
            int globalShapeOffset = coordinates.isEmpty() ? 0 : coordinates.size() - (duplicateBoundary ? 1 : 0);
            if (duplicateBoundary) {
                coordinates.addAll(legCoordinates.subList(1, legCoordinates.size()));
            } else {
                coordinates.addAll(legCoordinates);
            }

            JsonNode legSummary = legNode.path("summary");
            legs.add(new RouteLegDto(
                    index,
                    requiredNonNegativeNumber(legSummary, "length") * 1_000,
                    requiredNonNegativeNumber(legSummary, "time"),
                    toManeuvers(legNode.path("maneuvers"), globalShapeOffset)
            ));
        }

        if (coordinates.size() < 2) {
            throw invalidResponse();
        }
        log.debug("Combined pedestrian route coordinates={}", coordinates.size());
        return new PedestrianRouteResponseDto(coordinates, distanceMeters, durationSeconds, legs);
    }

    private List<RouteManeuverDto> toManeuvers(JsonNode maneuversNode, int globalShapeOffset) {
        if (!maneuversNode.isArray()) {
            throw invalidResponse();
        }
        List<RouteManeuverDto> maneuvers = new ArrayList<>();
        for (JsonNode maneuver : maneuversNode) {
            maneuvers.add(new RouteManeuverDto(
                    requiredText(maneuver, "instruction"),
                    requiredInteger(maneuver, "type"),
                    requiredNonNegativeNumber(maneuver, "length") * 1_000,
                    requiredNonNegativeNumber(maneuver, "time"),
                    optionalTextList(maneuver.path("street_names")),
                    globalShapeOffset + optionalNonNegativeInteger(maneuver, "begin_shape_index"),
                    globalShapeOffset + optionalNonNegativeInteger(maneuver, "end_shape_index")
            ));
        }
        return maneuvers;
    }

    private List<String> optionalTextList(JsonNode values) {
        if (values.isMissingNode() || values.isNull()) return List.of();
        if (!values.isArray()) throw invalidResponse();
        List<String> result = new ArrayList<>();
        for (JsonNode value : values) {
            if (!value.isTextual()) throw invalidResponse();
            result.add(value.textValue());
        }
        return List.copyOf(result);
    }

    private int optionalNonNegativeInteger(JsonNode parent, String field) {
        JsonNode value = parent.path(field);
        if (value.isMissingNode()) return 0;
        if (!value.canConvertToInt() || value.intValue() < 0) throw invalidResponse();
        return value.intValue();
    }

    private double requiredNonNegativeNumber(JsonNode parent, String field) {
        JsonNode value = parent.path(field);
        if (!value.isNumber() || !Double.isFinite(value.doubleValue()) || value.doubleValue() < 0) {
            throw invalidResponse();
        }
        return value.doubleValue();
    }

    private int requiredInteger(JsonNode parent, String field) {
        JsonNode value = parent.path(field);
        if (!value.canConvertToInt()) {
            throw invalidResponse();
        }
        return value.intValue();
    }

    private String requiredText(JsonNode parent, String field) {
        JsonNode value = parent.path(field);
        if (!value.isTextual() || value.textValue().isBlank()) {
            throw invalidResponse();
        }
        return value.textValue();
    }

    private PedestrianRouteException invalidResponse() {
        return new PedestrianRouteException(
                RouteErrorType.INVALID_RESPONSE,
                "도보 경로 서비스 응답을 처리할 수 없습니다."
        );
    }
}
