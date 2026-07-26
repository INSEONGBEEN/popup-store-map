package com.inseongbeen.popupstoremap.popupstore.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreRequestDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PopupStoreCommandService {

    private final PopupStoreRepository popupStoreRepository;

    @Transactional
    public PopupStoreResponseDto create(PopupStoreRequestDto request) {
        PopupStore popupStore = new PopupStore(
                request.name(), request.address(), request.latitude(), request.longitude(),
                request.startDate(), request.endDate(), request.category(), request.status(),
                request.description(), request.imageUrl()
        );
        return PopupStoreResponseDto.from(popupStoreRepository.saveAndFlush(popupStore));
    }

    @Transactional
    public PopupStoreResponseDto update(Long id, PopupStoreRequestDto request) {
        PopupStore popupStore = requirePopupStore(id);
        popupStore.update(
                request.name(), request.address(), request.latitude(), request.longitude(),
                request.startDate(), request.endDate(), request.category(), request.status(),
                request.description(), request.imageUrl()
        );
        return PopupStoreResponseDto.from(popupStore);
    }

    @Transactional
    public void delete(Long id) {
        popupStoreRepository.delete(requirePopupStore(id));
    }

    private PopupStore requirePopupStore(Long id) {
        return popupStoreRepository.findById(id)
                .orElseThrow(() -> new PopupStoreNotFoundException(id));
    }
}
