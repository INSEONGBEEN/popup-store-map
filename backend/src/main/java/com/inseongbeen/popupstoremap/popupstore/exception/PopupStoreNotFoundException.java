package com.inseongbeen.popupstoremap.popupstore.exception;

public class PopupStoreNotFoundException extends RuntimeException {

    public PopupStoreNotFoundException(Long id) {
        super("팝업스토어를 찾을 수 없습니다.");
    }
}
