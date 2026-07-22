package com.inseongbeen.popupstoremap.popupstore.engagement.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.popupstore.engagement.dto.EngagementEventRequestDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.LikeRequestDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.PopupEngagementDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.entity.EngagementEventType;
import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupEngagementEvent;
import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupEngagementSummary;
import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupLike;
import com.inseongbeen.popupstoremap.popupstore.engagement.repository.PopupEngagementEventRepository;
import com.inseongbeen.popupstoremap.popupstore.engagement.repository.PopupEngagementSummaryRepository;
import com.inseongbeen.popupstoremap.popupstore.engagement.repository.PopupLikeRepository;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PopupEngagementService {

    private final PopupStoreRepository popupStoreRepository;
    private final PopupEngagementSummaryRepository summaryRepository;
    private final PopupEngagementEventRepository eventRepository;
    private final PopupLikeRepository likeRepository;

    @Transactional
    public PopupEngagementDto recordView(Long popupStoreId, EngagementEventRequestDto request) {
        lockPopupStore(popupStoreId);
        PopupEngagementSummary summary = getOrCreateSummary(popupStoreId);
        if (!eventRepository.existsByPopupStoreIdAndSessionIdAndEventType(
                popupStoreId, request.sessionId(), EngagementEventType.DETAIL_VIEW)) {
            eventRepository.save(new PopupEngagementEvent(
                    popupStoreId, request.anonymousVisitorId(), request.sessionId(), EngagementEventType.DETAIL_VIEW));
            summary.incrementViewCount();
        }
        return response(summary, popupStoreId, request.anonymousVisitorId());
    }

    @Transactional
    public PopupEngagementDto recordPlanAdd(Long popupStoreId, EngagementEventRequestDto request) {
        lockPopupStore(popupStoreId);
        PopupEngagementSummary summary = getOrCreateSummary(popupStoreId);
        if (!eventRepository.existsByPopupStoreIdAndSessionIdAndEventType(
                popupStoreId, request.sessionId(), EngagementEventType.PLAN_ADD)) {
            eventRepository.save(new PopupEngagementEvent(
                    popupStoreId, request.anonymousVisitorId(), request.sessionId(), EngagementEventType.PLAN_ADD));
            summary.incrementPlanAddCount();
        }
        return response(summary, popupStoreId, request.anonymousVisitorId());
    }

    @Transactional
    public PopupEngagementDto like(Long popupStoreId, LikeRequestDto request) {
        lockPopupStore(popupStoreId);
        PopupEngagementSummary summary = getOrCreateSummary(popupStoreId);
        if (!likeRepository.existsByPopupStoreIdAndAnonymousVisitorId(popupStoreId, request.anonymousVisitorId())) {
            likeRepository.save(new PopupLike(popupStoreId, request.anonymousVisitorId()));
            summary.incrementLikeCount();
        }
        return PopupEngagementDto.from(summary, true);
    }

    @Transactional
    public PopupEngagementDto unlike(Long popupStoreId, LikeRequestDto request) {
        lockPopupStore(popupStoreId);
        PopupEngagementSummary summary = getOrCreateSummary(popupStoreId);
        likeRepository.findByPopupStoreIdAndAnonymousVisitorId(popupStoreId, request.anonymousVisitorId())
                .ifPresent(like -> {
                    likeRepository.delete(like);
                    summary.decrementLikeCount();
                });
        return PopupEngagementDto.from(summary, false);
    }

    public Map<Long, PopupEngagementDto> summaries(
            Collection<Long> popupStoreIds,
            String anonymousVisitorId
    ) {
        if (popupStoreIds.isEmpty()) return Map.of();
        Map<Long, PopupEngagementSummary> summaries = new HashMap<>();
        summaryRepository.findAllByPopupStoreIdIn(popupStoreIds)
                .forEach(summary -> summaries.put(summary.getPopupStoreId(), summary));
        Set<Long> likedIds = new HashSet<>();
        if (anonymousVisitorId != null && !anonymousVisitorId.isBlank()) {
            likeRepository.findAllByPopupStoreIdInAndAnonymousVisitorId(popupStoreIds, anonymousVisitorId)
                    .forEach(like -> likedIds.add(like.getPopupStoreId()));
        }
        Map<Long, PopupEngagementDto> result = new HashMap<>();
        popupStoreIds.forEach(id -> result.put(
                id,
                PopupEngagementDto.from(summaries.get(id), likedIds.contains(id))
        ));
        return result;
    }

    public Map<Long, RecentEngagement> recentEngagement(
            Collection<Long> popupStoreIds,
            LocalDateTime since
    ) {
        if (popupStoreIds.isEmpty()) return Map.of();
        Map<Long, MutableRecentEngagement> counts = new HashMap<>();
        eventRepository.countRecentEvents(popupStoreIds, since).forEach(row -> {
            MutableRecentEngagement count = counts.computeIfAbsent(
                    row.getPopupStoreId(), ignored -> new MutableRecentEngagement());
            if (row.getEventType() == EngagementEventType.DETAIL_VIEW) count.viewCount = row.getEventCount();
            if (row.getEventType() == EngagementEventType.PLAN_ADD) count.planAddCount = row.getEventCount();
        });
        likeRepository.countRecentLikes(popupStoreIds, since).forEach(row ->
                counts.computeIfAbsent(row.getPopupStoreId(), ignored -> new MutableRecentEngagement())
                        .likeCount = row.getLikeCount());
        Map<Long, RecentEngagement> result = new HashMap<>();
        popupStoreIds.forEach(id -> {
            MutableRecentEngagement count = counts.getOrDefault(id, new MutableRecentEngagement());
            result.put(id, new RecentEngagement(count.viewCount, count.likeCount, count.planAddCount));
        });
        return result;
    }

    public record RecentEngagement(long viewCount, long likeCount, long planAddCount) {
    }

    private static final class MutableRecentEngagement {
        private long viewCount;
        private long likeCount;
        private long planAddCount;
    }

    private void lockPopupStore(Long popupStoreId) {
        popupStoreRepository.findByIdForUpdate(popupStoreId)
                .orElseThrow(() -> new PopupStoreNotFoundException(popupStoreId));
    }

    private PopupEngagementSummary getOrCreateSummary(Long popupStoreId) {
        return summaryRepository.findById(popupStoreId)
                .orElseGet(() -> summaryRepository.save(new PopupEngagementSummary(popupStoreId)));
    }

    private PopupEngagementDto response(
            PopupEngagementSummary summary,
            Long popupStoreId,
            String anonymousVisitorId
    ) {
        return PopupEngagementDto.from(
                summary,
                likeRepository.existsByPopupStoreIdAndAnonymousVisitorId(popupStoreId, anonymousVisitorId)
        );
    }
}
