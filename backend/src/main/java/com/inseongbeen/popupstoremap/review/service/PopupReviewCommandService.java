package com.inseongbeen.popupstoremap.review.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.auth.security.CurrentUser;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.review.dto.ReviewRequestDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewResponseDto;
import com.inseongbeen.popupstoremap.review.entity.PopupReview;
import com.inseongbeen.popupstoremap.review.entity.PopupReviewSummary;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewRepository;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewSummaryRepository;
import com.inseongbeen.popupstoremap.visit.entity.VisitHistory;
import com.inseongbeen.popupstoremap.visit.entity.VisitSource;
import com.inseongbeen.popupstoremap.visit.repository.VisitHistoryRepository;

@Service
@Transactional(readOnly = true)
public class PopupReviewCommandService {
    private final PopupReviewRepository reviewRepository;
    private final PopupReviewSummaryRepository summaryRepository;
    private final VisitHistoryRepository visitRepository;
    private final PopupStoreRepository popupStoreRepository;
    private final CurrentUser currentUser;

    public PopupReviewCommandService(PopupReviewRepository reviewRepository,
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

    @Transactional
    public ReviewResponseDto create(Long popupStoreId, ReviewRequestDto request, Authentication authentication) {
        validateRating(request.rating());
        AppUser user = currentUser.require(authentication);
        PopupStore store = popupStoreRepository.findByIdForUpdate(popupStoreId)
                .orElseThrow(() -> new PopupStoreNotFoundException(popupStoreId));
        if (reviewRepository.existsByUserIdAndPopupStoreId(user.getId(), popupStoreId)) {
            throw new AuthException(HttpStatus.CONFLICT, "이미 이 팝업에 리뷰를 작성했습니다.");
        }
        VisitHistory visit = visitRepository
                .findTopByUserIdAndPopupStoreIdOrderByVisitedAtDesc(user.getId(), popupStoreId)
                .orElseThrow(() -> new AuthException(HttpStatus.FORBIDDEN, "방문 완료 후 리뷰를 작성할 수 있습니다."));
        String content = normalizedContent(request.content());
        try {
            PopupReview review = reviewRepository.saveAndFlush(
                    new PopupReview(user, store, visit, request.rating(), content)
            );
            summaryRepository.findById(popupStoreId)
                    .orElseGet(() -> summaryRepository.save(new PopupReviewSummary(popupStoreId)))
                    .add(request.rating());
            return response(review, user.getId());
        } catch (DataIntegrityViolationException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "이미 이 팝업에 리뷰를 작성했습니다.");
        }
    }

    @Transactional
    public ReviewResponseDto update(Long popupStoreId, Long reviewId, ReviewRequestDto request,
                                    Authentication authentication) {
        validateRating(request.rating());
        AppUser user = currentUser.require(authentication);
        popupStoreRepository.findByIdForUpdate(popupStoreId)
                .orElseThrow(() -> new PopupStoreNotFoundException(popupStoreId));
        PopupReview review = requireOwned(reviewId, popupStoreId, user.getId());
        int previous = review.update(request.rating(), normalizedContent(request.content()));
        getSummary(popupStoreId).replace(previous, request.rating());
        return response(review, user.getId());
    }

    @Transactional
    public void delete(Long popupStoreId, Long reviewId, Authentication authentication) {
        AppUser user = currentUser.require(authentication);
        popupStoreRepository.findByIdForUpdate(popupStoreId)
                .orElseThrow(() -> new PopupStoreNotFoundException(popupStoreId));
        PopupReview review = requireOwned(reviewId, popupStoreId, user.getId());
        getSummary(popupStoreId).remove(review.getRating());
        reviewRepository.delete(review);
    }

    private PopupReview requireOwned(Long reviewId, Long popupStoreId, Long userId) {
        PopupReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다."));
        if (!review.getPopupStore().getId().equals(popupStoreId)) {
            throw new AuthException(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다.");
        }
        if (!review.getUser().getId().equals(userId)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "본인의 리뷰만 변경할 수 있습니다.");
        }
        return review;
    }

    private ReviewResponseDto response(PopupReview review, Long currentUserId) {
        boolean verified = visitRepository.existsByUserIdAndPopupStoreIdAndSource(
                review.getUser().getId(), review.getPopupStore().getId(), VisitSource.NAVIGATION_ARRIVAL
        );
        return ReviewResponseDto.from(
                review,
                verified,
                review.getUser().getId().equals(currentUserId)
        );
    }

    private PopupReviewSummary getSummary(Long popupStoreId) {
        return summaryRepository.findById(popupStoreId)
                .orElseThrow(() -> new IllegalStateException("Review summary is missing"));
    }

    private static String normalizedContent(String content) {
        String normalized = content.trim();
        if (normalized.length() < 10 || normalized.length() > 1000) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "리뷰 내용은 10자 이상 1000자 이하여야 합니다.");
        }
        return normalized;
    }

    private static void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "평점은 1점 이상 5점 이하여야 합니다.");
        }
    }
}
