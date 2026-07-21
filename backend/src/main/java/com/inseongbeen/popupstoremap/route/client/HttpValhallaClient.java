package com.inseongbeen.popupstoremap.route.client;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inseongbeen.popupstoremap.route.config.ValhallaProperties;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

@Component
public class HttpValhallaClient implements ValhallaClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final URI routeUri;
    private final URI matrixUri;
    private final ValhallaProperties properties;

    public HttpValhallaClient(ValhallaProperties properties) {
        this.objectMapper = new ObjectMapper();
        this.properties = properties;
        this.routeUri = properties.baseUrl().resolve("/route");
        this.matrixUri = properties.baseUrl().resolve("/sources_to_targets");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.connectTimeout())
                .build();
    }

    @Override
    public JsonNode route(JsonNode request) {
        return post(routeUri, request);
    }

    @Override
    public JsonNode matrix(JsonNode request) {
        return post(matrixUri, request);
    }

    private JsonNode post(URI uri, JsonNode request) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder(uri)
                    .timeout(properties.requestTimeout())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                    .build();
            HttpResponse<String> response = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() >= 400 && response.statusCode() < 500) {
                throw new PedestrianRouteException(RouteErrorType.NO_ROUTE, "도보 경로를 찾을 수 없습니다.");
            }
            if (response.statusCode() >= 500) {
                throw unavailable();
            }
            return objectMapper.readTree(response.body());
        } catch (HttpTimeoutException exception) {
            throw new PedestrianRouteException(
                    RouteErrorType.UPSTREAM_TIMEOUT,
                    "도보 경로 서비스 응답 시간이 초과되었습니다."
            );
        } catch (ConnectException exception) {
            throw unavailable();
        } catch (JsonProcessingException exception) {
            throw new PedestrianRouteException(
                    RouteErrorType.INVALID_RESPONSE,
                    "도보 경로 서비스 응답을 처리할 수 없습니다."
            );
        } catch (IOException exception) {
            throw unavailable();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable();
        }
    }

    private PedestrianRouteException unavailable() {
        return new PedestrianRouteException(
                RouteErrorType.UPSTREAM_UNAVAILABLE,
                "도보 경로 서비스에 연결할 수 없습니다."
        );
    }
}
