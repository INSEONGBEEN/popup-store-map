package com.inseongbeen.popupstoremap.favorite.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.favorite.dto.FavoriteResponseDto;
import com.inseongbeen.popupstoremap.favorite.service.PopupFavoriteService;
import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/users/me/favorites")
public class PopupFavoriteController {
    private final PopupFavoriteService favoriteService;

    public PopupFavoriteController(PopupFavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{popupId}")
    @Operation(summary = "즐겨찾기 등록")
    public ResponseEntity<FavoriteResponseDto> add(Authentication authentication, @PathVariable Long popupId) {
        return ResponseEntity.ok(favoriteService.add(authentication, popupId));
    }

    @DeleteMapping("/{popupId}")
    @Operation(summary = "즐겨찾기 해제")
    public ResponseEntity<Void> remove(Authentication authentication, @PathVariable Long popupId) {
        favoriteService.remove(authentication, popupId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "내 즐겨찾기 목록")
    public PageResponseDto<FavoriteResponseDto> mine(Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return favoriteService.findMine(authentication, pageable);
    }
}
