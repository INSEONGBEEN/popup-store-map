package com.inseongbeen.popupstoremap.route.client;

import com.fasterxml.jackson.databind.JsonNode;

public interface ValhallaClient {
    JsonNode route(JsonNode request);

    default JsonNode matrix(JsonNode request) {
        throw new UnsupportedOperationException("Matrix is not configured for this client");
    }
}
