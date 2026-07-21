package com.inseongbeen.popupstoremap.popupstore.service;

import java.util.List;

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
@Transactional(readOnly = true)
public class PopupStoreService {

    private final PopupStoreRepository popupStoreRepository;

    @Transactional
    public PopupStoreResponseDto create(PopupStoreRequestDto request) {
        PopupStore popupStore = new PopupStore(
                request.name(),
                request.address(),
                request.latitude(),
                request.longitude(),
                request.startDate(),
                request.endDate(),
                request.description(),
                request.imageUrl()
        );

        return PopupStoreResponseDto.from(popupStoreRepository.saveAndFlush(popupStore));
    }

    public List<PopupStoreResponseDto> findAll() {
        return popupStoreRepository.findAll().stream()
                .map(PopupStoreResponseDto::from)
                .toList();
    }

    public PopupStoreResponseDto findById(Long id) {
        return PopupStoreResponseDto.from(getPopupStore(id));
    }

    @Transactional
    public PopupStoreResponseDto update(Long id, PopupStoreRequestDto request) {
        PopupStore popupStore = getPopupStore(id);
        popupStore.update(
                request.name(),
                request.address(),
                request.latitude(),
                request.longitude(),
                request.startDate(),
                request.endDate(),
                request.description(),
                request.imageUrl()
        );

        return PopupStoreResponseDto.from(popupStoreRepository.saveAndFlush(popupStore));
    }

    @Transactional
    public void delete(Long id) {
        popupStoreRepository.delete(getPopupStore(id));
    }

    private PopupStore getPopupStore(Long id) {
        return popupStoreRepository.findById(id)
                .orElseThrow(() -> new PopupStoreNotFoundException(id));
    }
}
