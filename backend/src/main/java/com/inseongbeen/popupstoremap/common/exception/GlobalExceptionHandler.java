package com.inseongbeen.popupstoremap.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PopupStoreNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePopupStoreNotFound(
            PopupStoreNotFoundException exception
    ) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                exception.getMessage()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException exception
    ) {
        String message = "Invalid value for parameter: " + exception.getName();
        return badRequest(message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return badRequest(exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception
    ) {
        return badRequest("요청 값 또는 좌표가 올바르지 않습니다.");
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
                .body(new ErrorResponse(status.value(), exception.getMessage()));
    }

    private ResponseEntity<ErrorResponse> badRequest(String message) {
        ErrorResponse response = new ErrorResponse(HttpStatus.BAD_REQUEST.value(), message);
        return ResponseEntity.badRequest().body(response);
    }
}
