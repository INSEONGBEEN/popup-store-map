package com.inseongbeen.popupstoremap.route.client;

import com.fasterxml.jackson.databind.JsonNode;

public interface ValhallaClient {
    JsonNode route(JsonNode request);
}
