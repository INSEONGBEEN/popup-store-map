package com.inseongbeen.popupstoremap.route.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.inseongbeen.popupstoremap.common.exception.GlobalExceptionHandler;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;
import com.inseongbeen.popupstoremap.route.service.PedestrianRouteService;

class PedestrianRouteControllerTests {

    private PedestrianRouteService routeService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        routeService = mock(PedestrianRouteService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PedestrianRouteController(routeService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void rejectsOutOfRangeCoordinate() throws Exception {
        mockMvc.perform(post("/api/routes/pedestrian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"coordinates":[
                                  {"longitude":181,"latitude":37.54},
                                  {"longitude":127.05,"latitude":37.55}
                                ]}
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(routeService);
    }

    @Test
    void rejectsFewerThanTwoCoordinates() throws Exception {
        mockMvc.perform(post("/api/routes/pedestrian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"coordinates":[{"longitude":127.05,"latitude":37.54}]}
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(routeService);
    }

    @Test
    void mapsNoRouteWithoutLeakingInternalDetails() throws Exception {
        when(routeService.findRoute(any())).thenThrow(new PedestrianRouteException(
                RouteErrorType.NO_ROUTE,
                "도보 경로를 찾을 수 없습니다."
        ));

        mockMvc.perform(post("/api/routes/pedestrian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("도보 경로를 찾을 수 없습니다."))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("localhost")
                )));
    }

    @Test
    void mapsUpstreamFailureAndTimeout() throws Exception {
        when(routeService.findRoute(any()))
                .thenThrow(new PedestrianRouteException(
                        RouteErrorType.UPSTREAM_UNAVAILABLE,
                        "도보 경로 서비스에 연결할 수 없습니다."
                ))
                .thenThrow(new PedestrianRouteException(
                        RouteErrorType.UPSTREAM_TIMEOUT,
                        "도보 경로 서비스 응답 시간이 초과되었습니다."
                ));

        mockMvc.perform(post("/api/routes/pedestrian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isServiceUnavailable());
        mockMvc.perform(post("/api/routes/pedestrian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isGatewayTimeout());
    }

    private String validRequest() {
        return """
                {"coordinates":[
                  {"longitude":127.05,"latitude":37.54},
                  {"longitude":127.06,"latitude":37.55}
                ]}
                """;
    }
}
