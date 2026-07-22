package com.inseongbeen.popupstoremap.auth.dto;

public record AuthResponseDto(String accessToken, long expiresIn, UserResponseDto user) {
}
