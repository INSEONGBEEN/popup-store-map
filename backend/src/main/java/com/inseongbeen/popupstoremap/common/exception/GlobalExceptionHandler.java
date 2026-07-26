package com.inseongbeen.popupstoremap.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(error(exception.getStatus(), "AUTH_ERROR", exception.getMessage()));
    }

    @ExceptionHandler(PopupStoreNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePopupStoreNotFound(
            PopupStoreNotFoundException exception
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error(HttpStatus.NOT_FOUND, "POPUP_NOT_FOUND", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException exception
    ) {
        String message = "Invalid value for parameter: " + exception.getName();
        return badRequest("INVALID_PARAMETER", message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return badRequest("INVALID_REQUEST", "요청 값이 올바르지 않습니다.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception
    ) {
        return badRequest("VALIDATION_FAILED", "요청 값 또는 좌표가 올바르지 않습니다.");
    }

    @ExceptionHandler(PedestrianRouteException.class)
    public ResponseEntity<ErrorResponse> handlePedestrianRoute(PedestrianRouteException exception) {
        HttpStatus status = switch (exception.getType()) {
            case NO_ROUTE -> HttpStatus.UNPROCESSABLE_ENTITY;
            case INVALID_RESPONSE -> HttpStatus.BAD_GATEWAY;
            case UPSTREAM_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            case UPSTREAM_TIMEOUT -> HttpStatus.GATEWAY_TIMEOUT;
        };
        return ResponseEntity.status(status)
                .body(error(status, "ROUTE_" + exception.getType().name(), exception.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException exception) {
        log.warn("Database constraint rejected a request", exception);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(error(HttpStatus.CONFLICT, "DATA_CONFLICT", "요청한 변경을 적용할 수 없습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {
        log.error("Unexpected request failure", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 오류가 발생했습니다."));
    }

    private ResponseEntity<ErrorResponse> badRequest(String code, String message) {
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, code, message));
    }

    private ErrorResponse error(HttpStatus status, String code, String message) {
        return new ErrorResponse(status.value(), code, message);
    }
}
