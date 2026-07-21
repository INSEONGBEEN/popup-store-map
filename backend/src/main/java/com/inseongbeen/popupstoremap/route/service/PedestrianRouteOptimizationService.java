package com.inseongbeen.popupstoremap.route.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.inseongbeen.popupstoremap.route.client.ValhallaClient;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteOptimizationRequestDto;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteOptimizationResponseDto;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteRequestDto;
import com.inseongbeen.popupstoremap.route.dto.RouteCoordinateDto;
import com.inseongbeen.popupstoremap.route.dto.RouteMetricsDto;
import com.inseongbeen.popupstoremap.route.dto.RouteOptimizationDestinationDto;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

@Service
public class PedestrianRouteOptimizationService {

    private final ValhallaClient valhallaClient;
    private final PedestrianRouteService routeService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PedestrianRouteOptimizationService(ValhallaClient valhallaClient, PedestrianRouteService routeService) {
        this.valhallaClient = valhallaClient;
        this.routeService = routeService;
    }

    public PedestrianRouteOptimizationResponseDto optimize(PedestrianRouteOptimizationRequestDto request) {
        validateUniqueIds(request.destinations());
        List<RouteCoordinateDto> allLocations = new ArrayList<>();
        allLocations.add(request.origin());
        request.destinations().forEach(destination -> allLocations.add(destination.coordinate()));

        Matrix matrix = parseMatrix(valhallaClient.matrix(toMatrixRequest(allLocations)), allLocations.size());
        boolean distanceCost = "distance".equalsIgnoreCase(request.costType());
        double[][] selectedCosts = distanceCost ? matrix.distances() : matrix.times();
        int destinationCount = request.destinations().size();
        double[] originCosts = new double[destinationCount];
        double[][] destinationCosts = new double[destinationCount][destinationCount];
        for (int index = 0; index < destinationCount; index++) {
            originCosts[index] = selectedCosts[0][index + 1];
            for (int target = 0; target < destinationCount; target++) {
                destinationCosts[index][target] = selectedCosts[index + 1][target + 1];
            }
        }

        List<Integer> order = ExactOpenRouteOptimizer.optimize(originCosts, destinationCosts);
        List<RouteOptimizationDestinationDto> ordered = order.stream()
                .map(request.destinations()::get)
                .toList();
        List<RouteCoordinateDto> originalCoordinates = coordinates(request.origin(), request.destinations());
        List<RouteCoordinateDto> optimizedCoordinates = coordinates(request.origin(), ordered);
        var originalRoute = routeService.findRoute(new PedestrianRouteRequestDto(originalCoordinates));
        var optimizedRoute = routeService.findRoute(new PedestrianRouteRequestDto(optimizedCoordinates));
        RouteMetricsDto original = new RouteMetricsDto(originalRoute.distanceMeters(), originalRoute.durationSeconds());
        RouteMetricsDto optimized = new RouteMetricsDto(optimizedRoute.distanceMeters(), optimizedRoute.durationSeconds());

        return new PedestrianRouteOptimizationResponseDto(
                request.destinations().stream().map(RouteOptimizationDestinationDto::id).toList(),
                ordered.stream().map(RouteOptimizationDestinationDto::id).toList(),
                ordered,
                optimizedRoute,
                original,
                optimized,
                new RouteMetricsDto(
                        original.distanceMeters() - optimized.distanceMeters(),
                        original.durationSeconds() - optimized.durationSeconds()
                ),
                "exact-held-karp"
        );
    }

    ObjectNode toMatrixRequest(List<RouteCoordinateDto> coordinates) {
        ObjectNode request = objectMapper.createObjectNode();
        ArrayNode sources = request.putArray("sources");
        ArrayNode targets = request.putArray("targets");
        coordinates.forEach(coordinate -> {
            sources.add(location(coordinate));
            targets.add(location(coordinate));
        });
        request.put("costing", "pedestrian");
        request.put("units", "kilometers");
        return request;
    }

    Matrix parseMatrix(JsonNode response, int expectedSize) {
        JsonNode rows = response.path("sources_to_targets");
        if (!rows.isArray() || rows.size() != expectedSize) throw invalidMatrix();
        double[][] times = new double[expectedSize][expectedSize];
        double[][] distances = new double[expectedSize][expectedSize];
        for (int from = 0; from < expectedSize; from++) {
            JsonNode row = rows.get(from);
            if (!row.isArray() || row.size() != expectedSize) throw invalidMatrix();
            for (int to = 0; to < expectedSize; to++) {
                JsonNode cell = row.get(to);
                times[from][to] = requiredCost(cell, "time");
                distances[from][to] = requiredCost(cell, "distance") * 1_000;
            }
        }
        return new Matrix(times, distances);
    }

    private ObjectNode location(RouteCoordinateDto coordinate) {
        return objectMapper.createObjectNode()
                .put("lat", coordinate.latitude())
                .put("lon", coordinate.longitude());
    }

    private List<RouteCoordinateDto> coordinates(
            RouteCoordinateDto origin,
            List<RouteOptimizationDestinationDto> destinations
    ) {
        List<RouteCoordinateDto> coordinates = new ArrayList<>();
        coordinates.add(origin);
        destinations.forEach(destination -> coordinates.add(destination.coordinate()));
        return List.copyOf(coordinates);
    }

    private void validateUniqueIds(List<RouteOptimizationDestinationDto> destinations) {
        Set<Long> ids = new HashSet<>();
        if (destinations.stream().anyMatch(destination -> !ids.add(destination.id()))) {
            throw new IllegalArgumentException("방문지 ID는 중복될 수 없습니다.");
        }
    }

    private double requiredCost(JsonNode cell, String field) {
        JsonNode value = cell.path(field);
        if (!value.isNumber() || !Double.isFinite(value.doubleValue()) || value.doubleValue() < 0) {
            throw new PedestrianRouteException(RouteErrorType.NO_ROUTE, "연결할 수 없는 도보 구간이 있습니다.");
        }
        return value.doubleValue();
    }

    private PedestrianRouteException invalidMatrix() {
        return new PedestrianRouteException(RouteErrorType.INVALID_RESPONSE, "도보 비용 행렬 응답을 처리할 수 없습니다.");
    }

    record Matrix(double[][] times, double[][] distances) {
    }
}
