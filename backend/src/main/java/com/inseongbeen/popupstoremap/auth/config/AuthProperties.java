package com.inseongbeen.popupstoremap.auth.config;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AuthProperties {
    private final String jwtSecret;
    private final boolean secureCookie;
    private final List<String> allowedOrigins;

    public AuthProperties(
            @Value("${JWT_SECRET:}") String jwtSecret,
            @Value("${AUTH_COOKIE_SECURE:false}") boolean secureCookie,
            @Value("${AUTH_ALLOWED_ORIGINS:http://localhost:5173,http://127.0.0.1:5173}") List<String> allowedOrigins
    ) {
        if (jwtSecret == null || jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes");
        }
        this.jwtSecret = jwtSecret;
        this.secureCookie = secureCookie;
        this.allowedOrigins = List.copyOf(allowedOrigins);
    }

    public String jwtSecret() { return jwtSecret; }
    public boolean secureCookie() { return secureCookie; }
    public List<String> allowedOrigins() { return allowedOrigins; }
    public Duration accessTokenTtl() { return Duration.ofMinutes(15); }
    public Duration refreshTokenTtl() { return Duration.ofDays(10); }
}
