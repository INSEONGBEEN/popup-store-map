package com.inseongbeen.popupstoremap.auth.dto;

import java.time.LocalDateTime;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.entity.UserRole;

public record UserResponseDto(
        Long id,
        String email,
        String nickname,
        UserRole role,
        LocalDateTime createdAt
) {
    public static UserResponseDto from(AppUser user) {
        return new UserResponseDto(user.getId(), user.getEmail(), user.getNickname(), user.getRole(), user.getCreatedAt());
    }
}
