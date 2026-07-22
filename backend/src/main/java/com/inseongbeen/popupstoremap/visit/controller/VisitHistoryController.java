package com.inseongbeen.popupstoremap.visit.controller;

import java.time.LocalDate;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.visit.dto.VisitRequestDto;
import com.inseongbeen.popupstoremap.visit.dto.VisitResponseDto;
import com.inseongbeen.popupstoremap.visit.service.VisitHistoryService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/me/visits")
public class VisitHistoryController {
    private final VisitHistoryService visitService;

    public VisitHistoryController(VisitHistoryService visitService) {
        this.visitService = visitService;
    }

    @PostMapping("/{popupId}")
    @Operation(summary = "방문 완료 기록")
    public VisitResponseDto record(Authentication authentication, @PathVariable Long popupId,
                                   @Valid @RequestBody VisitRequestDto request) {
        return visitService.record(authentication, popupId, request);
    }

    @GetMapping
    @Operation(summary = "내 방문 기록 목록")
    public PageResponseDto<VisitResponseDto> mine(Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 10, sort = "visitedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return visitService.findMine(authentication, from, to, pageable);
    }
}
