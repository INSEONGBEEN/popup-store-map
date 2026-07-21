package com.inseongbeen.popupstoremap.route.config;

import java.net.URI;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "routing.valhalla")
public record ValhallaProperties(URI baseUrl, Duration connectTimeout, Duration requestTimeout) {
}
