package com.inseongbeen.popupstoremap.popupstore.engagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EngagementEventRequestDto(
        @NotBlank @Size(max = 64) String anonymousVisitorId,
        @NotBlank @Size(max = 64) String sessionId
) {
}
