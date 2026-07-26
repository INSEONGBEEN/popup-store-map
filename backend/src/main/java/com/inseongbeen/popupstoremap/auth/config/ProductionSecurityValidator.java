package com.inseongbeen.popupstoremap.auth.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProductionSecurityValidator {

    public ProductionSecurityValidator(AuthProperties properties) {
        if (!properties.secureCookie()) {
            throw new IllegalStateException("Production requires a Secure refresh cookie");
        }
        boolean unsafeOrigin = properties.allowedOrigins().stream().anyMatch(origin ->
                !origin.startsWith("https://") || origin.contains("localhost") || origin.contains("127.0.0.1")
        );
        if (properties.allowedOrigins().isEmpty() || unsafeOrigin) {
            throw new IllegalStateException("Production requires explicit HTTPS allowed origins");
        }
    }
}
