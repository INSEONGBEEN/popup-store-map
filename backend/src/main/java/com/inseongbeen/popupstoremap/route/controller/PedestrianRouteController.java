package com.inseongbeen.popupstoremap.route.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteRequestDto;
import com.inseongbeen.popupstoremap.route.dto.PedestrianRouteResponseDto;
import com.inseongbeen.popupstoremap.route.service.PedestrianRouteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/routes")
public class PedestrianRouteController {

    private final PedestrianRouteService pedestrianRouteService;

    public PedestrianRouteController(PedestrianRouteService pedestrianRouteService) {
        this.pedestrianRouteService = pedestrianRouteService;
    }

    @Operation(summary = "도보 경로 계산", description = "입력 좌표 순서를 유지해 Valhalla 보행 경로를 계산합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "경로 계산 성공"),
            @ApiResponse(responseCode = "400", description = "좌표 또는 요청 형식 오류"),
            @ApiResponse(responseCode = "422", description = "도보 경로 없음"),
            @ApiResponse(responseCode = "502", description = "외부 경로 응답 형식 오류"),
            @ApiResponse(responseCode = "503", description = "외부 경로 서버 연결 실패"),
            @ApiResponse(responseCode = "504", description = "외부 경로 서버 응답 시간 초과")
    })
    @PostMapping("/pedestrian")
    public ResponseEntity<PedestrianRouteResponseDto> findPedestrianRoute(
            @Valid @RequestBody PedestrianRouteRequestDto request
    ) {
        return ResponseEntity.ok(pedestrianRouteService.findRoute(request));
    }
}
