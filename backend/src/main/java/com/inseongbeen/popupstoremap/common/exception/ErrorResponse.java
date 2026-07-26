package com.inseongbeen.popupstoremap.common.exception;

public record ErrorResponse(int status, String code, String message) {

    public ErrorResponse(int status, String message) {
        this(status, "REQUEST_FAILED", message);
    }
}
