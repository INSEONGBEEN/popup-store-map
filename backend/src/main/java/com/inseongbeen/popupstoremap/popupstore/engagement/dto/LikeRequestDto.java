package com.inseongbeen.popupstoremap.popupstore.engagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LikeRequestDto(@NotBlank @Size(max = 64) String anonymousVisitorId) {
}
