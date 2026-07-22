package com.inseongbeen.popupstoremap.popupstore.engagement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.popupstore.engagement.dto.EngagementEventRequestDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.LikeRequestDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.PopupEngagementDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.inseongbeen.popupstoremap.auth.security.CurrentUser;

@Tag(name = "Popup Engagement", description = "팝업스토어 익명 참여 지표 API")
@RestController
@RequestMapping("/api/popup-stores/{popupStoreId}/engagement")
@RequiredArgsConstructor
public class PopupEngagementController {

    private final PopupEngagementService engagementService;
    private final CurrentUser currentUser;

    @Operation(summary = "상세 조회 기록", description = "동일 세션의 동일 팝업 상세 조회는 한 번만 집계합니다.")
    @PostMapping("/view")
    public ResponseEntity<PopupEngagementDto> recordView(
            @PathVariable Long popupStoreId,
            @Valid @RequestBody EngagementEventRequestDto request
    ) {
        return ResponseEntity.ok(engagementService.recordView(popupStoreId, request));
    }

    @Operation(summary = "오늘 일정 추가 기록", description = "동일 세션의 동일 팝업 일정 추가는 한 번만 집계합니다.")
    @PostMapping("/plan-add")
    public ResponseEntity<PopupEngagementDto> recordPlanAdd(
            @PathVariable Long popupStoreId,
            @Valid @RequestBody EngagementEventRequestDto request
    ) {
        return ResponseEntity.ok(engagementService.recordPlanAdd(popupStoreId, request));
    }

    @Operation(summary = "좋아요", description = "익명 방문자별로 한 번만 좋아요를 생성합니다.")
    @PutMapping("/like")
    public ResponseEntity<PopupEngagementDto> like(
            @PathVariable Long popupStoreId,
            @Valid @RequestBody LikeRequestDto request,
            Authentication authentication
    ) {
        Long userId = currentUser.optional(authentication).map(user -> user.getId()).orElse(null);
        return ResponseEntity.ok(engagementService.like(popupStoreId, request, userId));
    }

    @Operation(summary = "좋아요 취소", description = "이미 취소된 좋아요도 안전하게 처리합니다.")
    @DeleteMapping("/like")
    public ResponseEntity<PopupEngagementDto> unlike(
            @PathVariable Long popupStoreId,
            @Valid @RequestBody LikeRequestDto request,
            Authentication authentication
    ) {
        Long userId = currentUser.optional(authentication).map(user -> user.getId()).orElse(null);
        return ResponseEntity.ok(engagementService.unlike(popupStoreId, request, userId));
    }
}
