package com.inseongbeen.popupstoremap.popupstore.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.inseongbeen.popupstoremap.common.exception.GlobalExceptionHandler;
import com.inseongbeen.popupstoremap.popupstore.service.PopupStoreService;

class PopupStoreSearchControllerTests {

    private PopupStoreService popupStoreService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        popupStoreService = mock(PopupStoreService.class);
        PopupStoreController controller = new PopupStoreController(popupStoreService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void rejectsInvalidEnumValue() throws Exception {
        mockMvc.perform(get("/api/popup-stores/search").param("category", "INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: category"));

        verifyNoInteractions(popupStoreService);
    }

    @Test
    void rejectsInvalidDateFormat() throws Exception {
        mockMvc.perform(get("/api/popup-stores/search").param("operatingDate", "2026/07/21"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: operatingDate"));

        verifyNoInteractions(popupStoreService);
    }
}
