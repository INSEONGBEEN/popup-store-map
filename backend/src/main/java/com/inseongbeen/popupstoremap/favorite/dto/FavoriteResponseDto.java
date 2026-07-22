package com.inseongbeen.popupstoremap.favorite.dto;

import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.favorite.entity.PopupFavorite;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;

public record FavoriteResponseDto(Long id, PopupStoreResponseDto popupStore, LocalDateTime createdAt) {
    public static FavoriteResponseDto from(PopupFavorite favorite) {
        return new FavoriteResponseDto(favorite.getId(),
                PopupStoreResponseDto.from(favorite.getPopupStore()), favorite.getCreatedAt());
    }
}
