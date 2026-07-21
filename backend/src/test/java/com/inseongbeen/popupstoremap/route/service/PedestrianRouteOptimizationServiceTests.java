package com.inseongbeen.popupstoremap.route.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inseongbeen.popupstoremap.route.client.ValhallaClient;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;

class PedestrianRouteOptimizationServiceTests {

    private final PedestrianRouteOptimizationService service = new PedestrianRouteOptimizationService(
            mock(ValhallaClient.class), mock(PedestrianRouteService.class));
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parsesAsymmetricTimeAndKilometerDistanceMatrix() throws Exception {
        var matrix = service.parseMatrix(objectMapper.readTree("""
                {"sources_to_targets":[
                  [{"time":0,"distance":0},{"time":12,"distance":0.4}],
                  [{"time":18,"distance":0.5},{"time":0,"distance":0}]
                ]}
                """), 2);

        assertThat(matrix.times()[0][1]).isEqualTo(12);
        assertThat(matrix.times()[1][0]).isEqualTo(18);
        assertThat(matrix.distances()[0][1]).isEqualTo(400);
    }

    @Test
    void rejectsMissingOrUnreachableMatrixCell() throws Exception {
        assertThatThrownBy(() -> service.parseMatrix(objectMapper.readTree("""
                {"sources_to_targets":[[{},{}],[{},{}]]}
                """), 2)).isInstanceOf(PedestrianRouteException.class);
    }
}
