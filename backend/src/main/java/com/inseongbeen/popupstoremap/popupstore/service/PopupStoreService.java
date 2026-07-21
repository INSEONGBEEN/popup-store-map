package com.inseongbeen.popupstoremap.popupstore.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreRequestDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PopupStoreService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "id", "name", "address", "category", "status",
            "startDate", "endDate", "createdAt", "updatedAt"
    );

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
                request.category(),
                request.status(),
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

    public PageResponseDto<PopupStoreResponseDto> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            Pageable pageable
    ) {
        Pageable normalizedPageable = normalizePageable(pageable);
        Page<PopupStoreResponseDto> result = popupStoreRepository.findAll(
                        PopupStoreSpecification.search(keyword, category, status, operatingDate),
                        normalizedPageable
                )
                .map(PopupStoreResponseDto::from);

        return PageResponseDto.from(result);
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
                request.category(),
                request.status(),
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

    private Pageable normalizePageable(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT_PROPERTIES.contains(order.getProperty())) {
                throw new IllegalArgumentException("Unsupported sort property: " + order.getProperty());
            }
        }

        int size = Math.min(pageable.getPageSize(), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
    }
}
