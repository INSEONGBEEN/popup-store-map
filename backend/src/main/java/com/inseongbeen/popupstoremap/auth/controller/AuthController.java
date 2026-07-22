package com.inseongbeen.popupstoremap.auth.controller;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inseongbeen.popupstoremap.auth.config.AuthProperties;
import com.inseongbeen.popupstoremap.auth.dto.AuthResponseDto;
import com.inseongbeen.popupstoremap.auth.dto.LoginRequestDto;
import com.inseongbeen.popupstoremap.auth.dto.SignupRequestDto;
import com.inseongbeen.popupstoremap.auth.dto.UserResponseDto;
import com.inseongbeen.popupstoremap.auth.service.AuthService;
import com.inseongbeen.popupstoremap.auth.service.AuthTokens;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    static final String REFRESH_COOKIE = "popup_refresh";

    private final AuthService authService;
    private final AuthProperties properties;

    public AuthController(AuthService authService, AuthProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> signup(@Valid @RequestBody SignupRequestDto request) {
        return ResponseEntity.status(201).body(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return withRefreshCookie(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        return withRefreshCookie(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication,
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        authService.logout(authentication, refreshToken);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, expiredCookie().toString()).build();
    }

    @GetMapping("/me")
    public UserResponseDto me(Authentication authentication) {
        return authService.me(authentication);
    }

    private ResponseEntity<AuthResponseDto> withRefreshCookie(AuthTokens tokens) {
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,
                refreshCookie(tokens.refreshToken()).toString()).body(tokens.response());
    }

    private ResponseCookie refreshCookie(String value) {
        return cookie(value, properties.refreshTokenTtl());
    }

    private ResponseCookie expiredCookie() {
        return cookie("", Duration.ZERO);
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(properties.secureCookie())
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(maxAge)
                .build();
    }
}
