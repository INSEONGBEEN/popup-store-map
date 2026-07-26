package com.inseongbeen.popupstoremap.popupstore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.entity.UserRole;
import com.inseongbeen.popupstoremap.auth.security.JwtTokenService;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.service.PopupStoreService;

@SpringBootTest
@AutoConfigureMockMvc
class PopupStoreAuthorizationIntegrationTests {

    private static final String REQUEST_BODY = """
            {
              "name": "관리자 등록 팝업",
              "address": "서울특별시 성동구 성수동",
              "latitude": 37.5445,
              "longitude": 127.0560,
              "startDate": "2026-07-26",
              "endDate": "2026-08-01",
              "category": "FASHION",
              "status": "OPEN"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @MockitoBean
    private PopupStoreService popupStoreService;

    @Test
    void anonymousCannotCreateUpdateOrDeletePopupStore() throws Exception {
        mockMvc.perform(post("/api/popup-stores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/popup-stores/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/popup-stores/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userCannotCreateUpdateOrDeletePopupStore() throws Exception {
        String token = accessToken(UserRole.USER);

        mockMvc.perform(post("/api/popup-stores")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/popup-stores/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/popup-stores/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateUpdateAndDeletePopupStore() throws Exception {
        String token = accessToken(UserRole.ADMIN);
        PopupStoreResponseDto response = response();
        when(popupStoreService.create(any())).thenReturn(response);
        when(popupStoreService.update(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/popup-stores")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(put("/api/popup-stores/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/popup-stores/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void popupStoreGetRemainsPublic() throws Exception {
        when(popupStoreService.findAll(isNull(), isNull())).thenReturn(List.of());

        mockMvc.perform(get("/api/popup-stores"))
                .andExpect(status().isOk());
    }

    @Test
    void adminRequestStillAppliesBeanValidation() throws Exception {
        String invalidCoordinates = REQUEST_BODY.replace("37.5445", "137.5445");

        mockMvc.perform(post("/api/popup-stores")
                        .header("Authorization", "Bearer " + accessToken(UserRole.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidCoordinates))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void corsAllowsConfiguredDevelopmentOriginButRejectsUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/popup-stores")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));

        mockMvc.perform(options("/api/popup-stores")
                        .header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    private String accessToken(UserRole role) {
        AppUser user = new AppUser("security-" + role + "@example.com", "unused", role.name());
        ReflectionTestUtils.setField(user, "id", role == UserRole.ADMIN ? 1L : 2L);
        ReflectionTestUtils.setField(user, "role", role);
        return jwtTokenService.createAccessToken(user);
    }

    private PopupStoreResponseDto response() {
        return new PopupStoreResponseDto(
                1L,
                "관리자 등록 팝업",
                "서울특별시 성동구 성수동",
                37.5445,
                127.0560,
                LocalDate.of(2026, 7, 26),
                LocalDate.of(2026, 8, 1),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
