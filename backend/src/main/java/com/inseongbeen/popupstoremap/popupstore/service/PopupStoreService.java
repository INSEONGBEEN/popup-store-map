package com.inseongbeen.popupstoremap.popupstore.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.PopupEngagementDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService.RecentEngagement;
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
    private final PopupEngagementService engagementService;

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
        return findAll(null);
    }

    public List<PopupStoreResponseDto> findAll(String anonymousVisitorId) {
        return findAll(anonymousVisitorId, null);
    }

    public List<PopupStoreResponseDto> findAll(String anonymousVisitorId, Long userId) {
        List<PopupStore> stores = popupStoreRepository.findAll();
        return mapWithEngagement(stores, anonymousVisitorId, userId);
    }

    public PopupStoreResponseDto findById(Long id) {
        return PopupStoreResponseDto.from(getPopupStore(id));
    }

    public List<PopupStoreResponseDto> findFeatured(int requestedLimit, String anonymousVisitorId) {
        return findFeatured(requestedLimit, anonymousVisitorId, null);
    }

    public List<PopupStoreResponseDto> findFeatured(int requestedLimit, String anonymousVisitorId, Long userId) {
        int limit = Math.max(1, Math.min(requestedLimit, 20));
        List<PopupStore> candidates = popupStoreRepository.findAllByStatusIn(
                List.of(PopupStoreStatus.OPEN, PopupStoreStatus.UPCOMING));
        if (candidates.isEmpty()) return List.of();

        List<Long> ids = candidates.stream().map(PopupStore::getId).toList();
        Map<Long, RecentEngagement> recent = engagementService.recentEngagement(
                ids, LocalDateTime.now().minusDays(30));
        double maxViews = maxLogCount(recent.values().stream().mapToLong(RecentEngagement::viewCount).max().orElse(0));
        double maxLikes = maxLogCount(recent.values().stream().mapToLong(RecentEngagement::likeCount).max().orElse(0));
        double maxPlans = maxLogCount(recent.values().stream().mapToLong(RecentEngagement::planAddCount).max().orElse(0));

        Comparator<PopupStore> ranking = Comparator
                .comparingDouble((PopupStore store) -> featuredScore(
                        recent.get(store.getId()), maxViews, maxLikes, maxPlans)).reversed()
                .thenComparing(Comparator.comparingLong(
                        (PopupStore store) -> recent.get(store.getId()).planAddCount()).reversed())
                .thenComparing(Comparator.comparingLong(
                        (PopupStore store) -> recent.get(store.getId()).likeCount()).reversed())
                .thenComparing(Comparator.comparingLong(
                        (PopupStore store) -> recent.get(store.getId()).viewCount()).reversed())
                .thenComparingInt(store -> store.getStatus() == PopupStoreStatus.OPEN ? 0 : 1)
                .thenComparing(PopupStore::getId, Comparator.reverseOrder());
        List<PopupStore> featured = candidates.stream().sorted(ranking).limit(limit).toList();
        return mapWithEngagement(featured, anonymousVisitorId, userId);
    }

    public PageResponseDto<PopupStoreResponseDto> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            Pageable pageable
    ) {
        return search(keyword, category, status, operatingDate, pageable, null, null);
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
        Pageable normalizedPageable = normalizePageable(pageable);
        Page<PopupStore> stores = popupStoreRepository.findAll(
                PopupStoreSpecification.search(keyword, category, status, operatingDate),
                normalizedPageable
        );
        Map<Long, PopupEngagementDto> engagement = engagementService.summaries(
                stores.getContent().stream().map(PopupStore::getId).toList(),
                anonymousVisitorId,
                userId
        );
        Page<PopupStoreResponseDto> result = stores.map(store -> PopupStoreResponseDto.from(
                store, engagement.getOrDefault(store.getId(), PopupEngagementDto.empty())
        ));

        return PageResponseDto.from(result);
    }

    public PageResponseDto<PopupStoreResponseDto> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            Pageable pageable,
            String anonymousVisitorId
    ) {
        return search(keyword, category, status, operatingDate, pageable, anonymousVisitorId, null);
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

    private List<PopupStoreResponseDto> mapWithEngagement(
            List<PopupStore> stores,
            String anonymousVisitorId,
            Long userId
    ) {
        Map<Long, PopupEngagementDto> engagement = engagementService.summaries(
                stores.stream().map(PopupStore::getId).toList(), anonymousVisitorId, userId
        );
        return stores.stream()
                .map(store -> PopupStoreResponseDto.from(
                        store, engagement.getOrDefault(store.getId(), PopupEngagementDto.empty())
                ))
                .toList();
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

    private static double maxLogCount(long value) {
        return value == 0 ? 1 : Math.log1p(value);
    }

    static double featuredScore(
            RecentEngagement engagement,
            double maxViews,
            double maxLikes,
            double maxPlans
    ) {
        return Math.log1p(engagement.viewCount()) / maxViews * 0.4
                + Math.log1p(engagement.likeCount()) / maxLikes * 0.3
                + Math.log1p(engagement.planAddCount()) / maxPlans * 0.3;
    }
}
