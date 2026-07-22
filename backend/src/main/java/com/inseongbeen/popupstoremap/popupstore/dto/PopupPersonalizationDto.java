package com.inseongbeen.popupstoremap.popupstore.dto;

public record PopupPersonalizationDto(
        boolean favoritedByCurrentUser,
        boolean visitedByCurrentUser,
        boolean reviewedByCurrentUser
) {
    public static PopupPersonalizationDto empty() {
        return new PopupPersonalizationDto(false, false, false);
    }
}
