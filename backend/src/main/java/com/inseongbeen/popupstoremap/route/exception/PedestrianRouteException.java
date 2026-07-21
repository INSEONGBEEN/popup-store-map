package com.inseongbeen.popupstoremap.route.exception;

public class PedestrianRouteException extends RuntimeException {

    private final RouteErrorType type;

    public PedestrianRouteException(RouteErrorType type, String message) {
        super(message);
        this.type = type;
    }

    public RouteErrorType getType() {
        return type;
    }
}
