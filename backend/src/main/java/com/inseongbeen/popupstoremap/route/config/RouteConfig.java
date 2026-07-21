package com.inseongbeen.popupstoremap.route.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:application-routing.properties")
@EnableConfigurationProperties(ValhallaProperties.class)
public class RouteConfig {
}
