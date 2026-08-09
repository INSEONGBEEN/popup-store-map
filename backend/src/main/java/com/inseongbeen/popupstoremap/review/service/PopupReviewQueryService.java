package com.inseongbeen.popupstoremap.review.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.security.CurrentUser;
import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.review.dto.MyReviewResponseDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewResponseDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewSummaryDto;
import com.inseongbeen.popupstoremap.review.entity.PopupReview;
import com.inseongbeen.popupstoremap.review.entity.PopupReviewSummary;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewRepository;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewSummaryRepository;
import com.inseongbeen.popupstoremap.visit.entity.VisitSource;
import com.inseongbeen.popupstoremap.visit.repository.VisitHistoryRepository;

@Service
@Transactional(readOnly = true)
public class PopupReviewQueryService {
    private static final int MAX_PAGE_SIZE = 50;

    private final PopupReviewRepository reviewRepository;
    private final PopupReviewSummaryRepository summaryRepository;
    private final VisitHistoryRepository visitRepository;
    private final PopupStoreRepository popupStoreRepository;
    private final CurrentUser currentUser;

    public PopupReviewQueryService(PopupReviewRepository reviewRepository,
                                   PopupReviewSummaryRepository summaryRepository,
                                   VisitHistoryRepository visitRepository,
                                   PopupStoreRepository popupStoreRepository,
                                   CurrentUser currentUser) {
        this.reviewRepository = reviewRepository;
        this.summaryRepository = summaryRepository;
        this.visitRepository = visitRepository;
        this.popupStoreRepository = popupStoreRepository;
        this.currentUser = currentUser;
    }

    public PageResponseDto<ReviewResponseDto> list(Long popupStoreId, String order,
                                                    Pageable pageable, Authentication authentication) {
        if (!popupStoreRepository.existsById(popupStoreId)) {
            throw new PopupStoreNotFoundException(popupStoreId);
        }
        Long currentUserId = currentUser.optional(authentication).map(AppUser::getId).orElse(null);
        Pageable safe = PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
                reviewSort(order)
        );
        Page<PopupReview> reviews = reviewRepository.findAllByPopupStoreId(popupStoreId, safe);
        Set<Long> verifiedUserIds = verifiedUserIds(popupStoreId, reviews.getContent());
        return PageResponseDto.from(reviews.map(review -> ReviewResponseDto.from(
                review,
                verifiedUserIds.contains(review.getUser().getId()),
                currentUserId != null && review.getUser().getId().equals(currentUserId)
        )));
    }

    public PageResponseDto<MyReviewResponseDto> mine(Authentication authentication, Pageable pageable) {
        AppUser user = currentUser.require(authentication);
        Pageable safe = PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "updatedAt")
        );
        Page<PopupReview> reviews = reviewRepository.findAllByUserId(user.getId(), safe);
        Set<Long> verifiedPopupStoreIds = verifiedPopupStoreIds(user.getId(), reviews.getContent());
        return PageResponseDto.from(reviews.map(review -> MyReviewResponseDto.from(
                review,
                verifiedPopupStoreIds.contains(review.getPopupStore().getId())
        )));
    }

    public Map<Long, ReviewSummaryDto> summaries(Collection<Long> popupStoreIds) {
        if (popupStoreIds.isEmpty()) {
            return Map.of();
        }
        return summaryRepository.findAllByPopupStoreIdIn(popupStoreIds).stream()
                .collect(Collectors.toMap(
                        PopupReviewSummary::getPopupStoreId,
                        (Function<PopupReviewSummary, ReviewSummaryDto>) ReviewSummaryDto::from
                ));
    }

    private Set<Long> verifiedUserIds(Long popupStoreId, Collection<PopupReview> reviews) {
        if (reviews.isEmpty()) {
            return Set.of();
        }
        List<Long> userIds = reviews.stream()
                .map(review -> review.getUser().getId())
                .distinct()
                .toList();
        return Set.copyOf(visitRepository.findUserIdsByPopupStoreIdAndUserIdInAndSource(
                popupStoreId, userIds, VisitSource.NAVIGATION_ARRIVAL
        ));
    }

    private Set<Long> verifiedPopupStoreIds(Long userId, Collection<PopupReview> reviews) {
        if (reviews.isEmpty()) {
            return Set.of();
        }
        List<Long> popupStoreIds = reviews.stream()
                .map(review -> review.getPopupStore().getId())
                .distinct()
                .toList();
        return Set.copyOf(visitRepository.findPopupStoreIdsByUserIdAndPopupStoreIdInAndSource(
                userId, popupStoreIds, VisitSource.NAVIGATION_ARRIVAL
        ));
    }

    private static Sort reviewSort(String order) {
        return switch (order == null ? "latest" : order) {
            case "latest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "rating_desc" -> Sort.by(Sort.Direction.DESC, "rating")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "rating_asc" -> Sort.by(Sort.Direction.ASC, "rating")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> throw new IllegalArgumentException("Unsupported review order: " + order);
        };
    }
}
