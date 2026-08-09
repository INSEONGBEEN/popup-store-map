package com.inseongbeen.popupstoremap.review.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.review.dto.MyReviewResponseDto;
import com.inseongbeen.popupstoremap.review.service.PopupReviewQueryService;

@RestController
@RequestMapping("/api/users/me/reviews")
public class MyReviewController {
    private final PopupReviewQueryService reviewQueryService;

    public MyReviewController(PopupReviewQueryService reviewQueryService) {
        this.reviewQueryService = reviewQueryService;
    }

    @GetMapping
    public PageResponseDto<MyReviewResponseDto> mine(Authentication authentication,
                                                      @PageableDefault(size = 10) Pageable pageable) {
        return reviewQueryService.mine(authentication, pageable);
    }
}
