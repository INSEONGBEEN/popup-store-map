package com.inseongbeen.popupstoremap.popupstore.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.popupstore.dto.PopupStoreResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService.RecentEngagement;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PopupStoreRankingService {

    private final PopupStoreRepository popupStoreRepository;
    private final PopupEngagementService engagementService;
    private final PopupStoreQueryService queryService;

    public List<PopupStoreResponseDto> findFeatured(
            int requestedLimit,
            String anonymousVisitorId,
            Long userId
    ) {
        int limit = Math.max(1, Math.min(requestedLimit, 20));
        List<PopupStore> candidates = popupStoreRepository.findAllByStatusIn(
                List.of(PopupStoreStatus.OPEN, PopupStoreStatus.UPCOMING)
        );
        if (candidates.isEmpty()) return List.of();

        List<Long> ids = candidates.stream().map(PopupStore::getId).toList();
        Map<Long, RecentEngagement> recent = engagementService.recentEngagement(
                ids, LocalDateTime.now().minusDays(30)
        );
        double maxViews = maxLogCount(recent.values().stream()
                .mapToLong(RecentEngagement::viewCount).max().orElse(0));
        double maxLikes = maxLogCount(recent.values().stream()
                .mapToLong(RecentEngagement::likeCount).max().orElse(0));
        double maxPlans = maxLogCount(recent.values().stream()
                .mapToLong(RecentEngagement::planAddCount).max().orElse(0));

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

        return queryService.responses(
                candidates.stream().sorted(ranking).limit(limit).toList(),
                anonymousVisitorId,
                userId
        );
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
