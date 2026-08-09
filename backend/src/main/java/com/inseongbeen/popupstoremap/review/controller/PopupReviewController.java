package com.inseongbeen.popupstoremap.review.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewRequestDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewResponseDto;
import com.inseongbeen.popupstoremap.review.service.PopupReviewCommandService;
import com.inseongbeen.popupstoremap.review.service.PopupReviewQueryService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/popup-stores/{popupId}/reviews")
public class PopupReviewController {
    private final PopupReviewQueryService reviewQueryService;
    private final PopupReviewCommandService reviewCommandService;

    public PopupReviewController(PopupReviewQueryService reviewQueryService,
                                 PopupReviewCommandService reviewCommandService) {
        this.reviewQueryService = reviewQueryService;
        this.reviewCommandService = reviewCommandService;
    }

    @GetMapping
    @Operation(summary = "팝업 리뷰 목록")
    public PageResponseDto<ReviewResponseDto> list(@PathVariable Long popupId,
            @RequestParam(defaultValue = "latest") String sort,
            @PageableDefault(size = 10) Pageable pageable, Authentication authentication) {
        return reviewQueryService.list(popupId, sort, pageable, authentication);
    }

    @PostMapping
    @Operation(summary = "방문한 팝업 리뷰 작성")
    public ResponseEntity<ReviewResponseDto> create(@PathVariable Long popupId,
            @Valid @RequestBody ReviewRequestDto request, Authentication authentication) {
        return ResponseEntity.status(201).body(reviewCommandService.create(popupId, request, authentication));
    }

    @PatchMapping("/{reviewId}")
    @Operation(summary = "내 리뷰 수정")
    public ReviewResponseDto update(@PathVariable Long popupId, @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequestDto request, Authentication authentication) {
        return reviewCommandService.update(popupId, reviewId, request, authentication);
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "내 리뷰 삭제")
    public ResponseEntity<Void> delete(@PathVariable Long popupId, @PathVariable Long reviewId,
                                       Authentication authentication) {
        reviewCommandService.delete(popupId, reviewId, authentication);
        return ResponseEntity.noContent().build();
    }
}
