package com.inseongbeen.popupstoremap.popupstore.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreRequestDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;

import lombok.RequiredArgsConstructor;

/**
 * Stable application facade for the existing PopupStore API.
 * Transaction boundaries and changing responsibilities live in the focused services.
 */
@Service
@RequiredArgsConstructor
public class PopupStoreService {

    private final PopupStoreCommandService commandService;
    private final PopupStoreQueryService queryService;
    private final PopupStoreRankingService rankingService;

    public PopupStoreResponseDto create(PopupStoreRequestDto request) {
        return commandService.create(request);
    }

    public List<PopupStoreResponseDto> findAll() {
        return queryService.findAll(null, null);
    }

    public List<PopupStoreResponseDto> findAll(String anonymousVisitorId) {
        return queryService.findAll(anonymousVisitorId, null);
    }

    public List<PopupStoreResponseDto> findAll(String anonymousVisitorId, Long userId) {
        return queryService.findAll(anonymousVisitorId, userId);
    }

    public PopupStoreResponseDto findById(Long id) {
        return queryService.findById(id, null, null);
    }

    public PopupStoreResponseDto findById(Long id, String anonymousVisitorId, Long userId) {
        return queryService.findById(id, anonymousVisitorId, userId);
    }

    public List<PopupStoreResponseDto> findFeatured(int limit, String anonymousVisitorId) {
        return rankingService.findFeatured(limit, anonymousVisitorId, null);
    }

    public List<PopupStoreResponseDto> findFeatured(int limit, String anonymousVisitorId, Long userId) {
        return rankingService.findFeatured(limit, anonymousVisitorId, userId);
    }

    public PageResponseDto<PopupStoreResponseDto> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            Pageable pageable
    ) {
        return queryService.search(keyword, category, status, operatingDate, pageable, null, null);
    }

    public PageResponseDto<PopupStoreResponseDto> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            Pageable pageable,
            String anonymousVisitorId
    ) {
        return queryService.search(keyword, category, status, operatingDate, pageable, anonymousVisitorId, null);
    }

    public PageResponseDto<PopupStoreResponseDto> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            Pageable pageable,
            String anonymousVisitorId,
            Long userId
    ) {
        return queryService.search(keyword, category, status, operatingDate, pageable, anonymousVisitorId, userId);
    }

    public PopupStoreResponseDto update(Long id, PopupStoreRequestDto request) {
        return commandService.update(id, request);
    }

    public void delete(Long id) {
        commandService.delete(id);
    }
}
