package com.inseongbeen.popupstoremap.popupstore.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.favorite.repository.PopupFavoriteRepository;
import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupPersonalizationDto;
import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.PopupEngagementDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreSpecification;
import com.inseongbeen.popupstoremap.review.dto.ReviewSummaryDto;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewRepository;
import com.inseongbeen.popupstoremap.review.service.PopupReviewService;
import com.inseongbeen.popupstoremap.visit.repository.VisitHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PopupStoreQueryService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "id", "name", "address", "category", "status",
            "startDate", "endDate", "createdAt", "updatedAt"
    );

    private final PopupStoreRepository popupStoreRepository;
    private final PopupEngagementService engagementService;
    private final PopupReviewService reviewService;
    private final PopupFavoriteRepository favoriteRepository;
    private final VisitHistoryRepository visitRepository;
    private final PopupReviewRepository reviewRepository;

    public List<PopupStoreResponseDto> findAll(String anonymousVisitorId, Long userId) {
        return responses(popupStoreRepository.findAll(), anonymousVisitorId, userId);
    }

    public PopupStoreResponseDto findById(Long id, String anonymousVisitorId, Long userId) {
        return responses(List.of(requirePopupStore(id)), anonymousVisitorId, userId).getFirst();
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
        Page<PopupStore> stores = popupStoreRepository.findAll(
                PopupStoreSpecification.search(keyword, category, status, operatingDate),
                normalized(pageable)
        );
        Map<Long, PopupStoreResponseDto> responses = responses(
                stores.getContent(), anonymousVisitorId, userId
        ).stream().collect(Collectors.toMap(PopupStoreResponseDto::id, response -> response));
        return PageResponseDto.from(stores.map(store -> responses.get(store.getId())));
    }

    public List<PopupStoreResponseDto> responses(
            List<PopupStore> stores,
            String anonymousVisitorId,
            Long userId
    ) {
        if (stores.isEmpty()) return List.of();
        List<Long> ids = stores.stream().map(PopupStore::getId).toList();
        Map<Long, PopupEngagementDto> engagement = engagementService.summaries(ids, anonymousVisitorId, userId);
        Map<Long, ReviewSummaryDto> reviews = reviewService.summaries(ids);
        Map<Long, PopupPersonalizationDto> personalization = personalization(ids, userId);
        return stores.stream().map(store -> PopupStoreResponseDto.from(
                store,
                engagement.getOrDefault(store.getId(), PopupEngagementDto.empty()),
                reviews.getOrDefault(store.getId(), ReviewSummaryDto.empty()),
                personalization.getOrDefault(store.getId(), PopupPersonalizationDto.empty())
        )).toList();
    }

    private Map<Long, PopupPersonalizationDto> personalization(List<Long> ids, Long userId) {
        if (userId == null || ids.isEmpty()) return Map.of();
        Set<Long> favorites = favoriteRepository.findAllByUserIdAndPopupStoreIdIn(userId, ids).stream()
                .map(favorite -> favorite.getPopupStore().getId())
                .collect(Collectors.toSet());
        Set<Long> visits = Set.copyOf(visitRepository.findVisitedPopupStoreIds(userId, ids));
        Set<Long> reviews = Set.copyOf(reviewRepository.findReviewedPopupStoreIds(userId, ids));
        return ids.stream().collect(Collectors.toMap(
                id -> id,
                id -> new PopupPersonalizationDto(
                        favorites.contains(id), visits.contains(id), reviews.contains(id)
                )
        ));
    }

    private Pageable normalized(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT_PROPERTIES.contains(order.getProperty())) {
                throw new IllegalArgumentException("Unsupported sort property: " + order.getProperty());
            }
        }
        return PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
                pageable.getSort()
        );
    }

    private PopupStore requirePopupStore(Long id) {
        return popupStoreRepository.findById(id)
                .orElseThrow(() -> new PopupStoreNotFoundException(id));
    }
}
