package com.inseongbeen.popupstoremap.auth.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.inseongbeen.popupstoremap.auth.config.AuthProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CookieOriginFilter extends OncePerRequestFilter {
    private final AuthProperties properties;

    public CookieOriginFilter(AuthProperties properties) {
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) return true;
        return !(request.getRequestURI().equals("/api/auth/refresh")
                || request.getRequestURI().equals("/api/auth/logout"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (origin != null && !properties.allowedOrigins().contains(origin)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":403,\"message\":\"허용되지 않은 요청 출처입니다.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
