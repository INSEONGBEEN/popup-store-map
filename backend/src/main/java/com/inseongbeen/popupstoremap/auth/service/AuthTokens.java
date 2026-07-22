package com.inseongbeen.popupstoremap.auth.service;

import com.inseongbeen.popupstoremap.auth.dto.AuthResponseDto;

public record AuthTokens(AuthResponseDto response, String refreshToken) {
}
