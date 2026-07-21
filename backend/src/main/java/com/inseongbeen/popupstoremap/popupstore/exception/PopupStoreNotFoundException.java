package com.inseongbeen.popupstoremap.popupstore.exception;

public class PopupStoreNotFoundException extends RuntimeException {

    public PopupStoreNotFoundException(Long id) {
        super("Popup store not found: " + id);
    }
}
