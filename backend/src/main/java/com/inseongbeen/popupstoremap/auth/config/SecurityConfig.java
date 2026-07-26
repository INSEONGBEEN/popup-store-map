package com.inseongbeen.popupstoremap.auth.config;

import java.io.IOException;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.inseongbeen.popupstoremap.auth.security.CookieOriginFilter;
import com.inseongbeen.popupstoremap.auth.security.JwtTokenService;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtTokenService tokens,
            CookieOriginFilter originFilter,
            JwtAuthenticationConverter authenticationConverter
    ) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/popup-stores").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/popup-stores/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/popup-stores/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/popup-stores/*/reviews").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/popup-stores/*/reviews/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/popup-stores/*/reviews/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/popup-stores/**").permitAll()
                        .requestMatchers("/api/popup-stores/*/engagement/**", "/api/routes/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt
                                .decoder(tokens.decoder())
                                .jwtAuthenticationConverter(authenticationConverter))
                        .authenticationEntryPoint((request, response, exception) ->
                                writeSecurityError(response, HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.")))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                writeSecurityError(response, HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."))
                        .accessDeniedHandler((request, response, exception) ->
                                writeSecurityError(response, HttpStatus.FORBIDDEN, "접근 권한이 없습니다.")))
                .addFilterBefore(originFilter, BearerTokenAuthenticationFilter.class)
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("role");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter authenticationConverter = new JwtAuthenticationConverter();
        authenticationConverter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return authenticationConverter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(AuthProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of(
                "Authorization", "Content-Type", "X-Anonymous-Visitor-Id"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static void writeSecurityError(HttpServletResponse response, HttpStatus status, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":" + status.value()
                + ",\"code\":\"" + status.name() + "\",\"message\":\"" + message + "\"}");
    }
}
