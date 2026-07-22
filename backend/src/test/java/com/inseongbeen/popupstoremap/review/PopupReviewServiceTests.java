package com.inseongbeen.popupstoremap.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import com.inseongbeen.popupstoremap.auth.dto.SignupRequestDto;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.auth.repository.AppUserRepository;
import com.inseongbeen.popupstoremap.auth.repository.RefreshTokenRepository;
import com.inseongbeen.popupstoremap.auth.service.AuthService;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.review.dto.ReviewRequestDto;
import com.inseongbeen.popupstoremap.review.dto.ReviewResponseDto;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewRepository;
import com.inseongbeen.popupstoremap.review.repository.PopupReviewSummaryRepository;
import com.inseongbeen.popupstoremap.review.service.PopupReviewService;
import com.inseongbeen.popupstoremap.visit.dto.VisitRequestDto;
import com.inseongbeen.popupstoremap.visit.entity.VisitSource;
import com.inseongbeen.popupstoremap.visit.repository.VisitHistoryRepository;
import com.inseongbeen.popupstoremap.visit.service.VisitHistoryService;

@SpringBootTest
class PopupReviewServiceTests {
    @Autowired PopupReviewService reviewService;
    @Autowired VisitHistoryService visitService;
    @Autowired PopupReviewRepository reviewRepository;
    @Autowired PopupReviewSummaryRepository summaryRepository;
    @Autowired VisitHistoryRepository visitRepository;
    @Autowired PopupStoreRepository popupStoreRepository;
    @Autowired AppUserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired AuthService authService;

    private Long popupStoreId;
    private Authentication owner;
    private Authentication other;

    @BeforeEach
    void setUp() {
        popupStoreId = popupStoreRepository.saveAndFlush(new PopupStore(
                "리뷰 테스트", "서울 성동구", 37.54, 127.05,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1),
                PopupStoreCategory.BEAUTY, PopupStoreStatus.OPEN, null, null)).getId();
        owner = auth(authService.signup(new SignupRequestDto(
                "review-a@example.com", "test-password-123", "리뷰회원A")).id());
        other = auth(authService.signup(new SignupRequestDto(
                "review-b@example.com", "test-password-123", "리뷰회원B")).id());
    }

    @AfterEach
    void cleanUp() {
        reviewRepository.deleteAll();
        summaryRepository.deleteAll();
        visitRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
        popupStoreRepository.deleteAll();
    }

    @Test
    void visitIsRequiredAndOneReviewPerUserAndPopupIsEnforced() {
        assertThatThrownBy(() -> reviewService.create(popupStoreId,
                new ReviewRequestDto(5, "방문 전에는 작성할 수 없는 리뷰입니다."), owner))
                .isInstanceOfSatisfying(AuthException.class,
                        exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        visitService.record(owner, popupStoreId, new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, null, null));
        reviewService.create(popupStoreId, new ReviewRequestDto(5, "방문 후 작성한 충분히 긴 리뷰입니다."), owner);
        assertThatThrownBy(() -> reviewService.create(popupStoreId,
                new ReviewRequestDto(4, "두 번째로 작성하려는 리뷰입니다."), owner))
                .isInstanceOfSatisfying(AuthException.class,
                        exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void createUpdateDeleteKeepSummaryConsistentAndOwnershipIsEnforced() {
        visitService.record(owner, popupStoreId, new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, null, null));
        var created = reviewService.create(popupStoreId,
                new ReviewRequestDto(5, "평균 집계를 확인하는 첫 리뷰입니다."), owner);

        assertThat(summaryRepository.findById(popupStoreId).orElseThrow().getAverageRating()).isEqualTo(5);
        assertThatThrownBy(() -> reviewService.update(popupStoreId, created.reviewId(),
                new ReviewRequestDto(1, "다른 사용자가 수정하려는 리뷰입니다."), other))
                .isInstanceOfSatisfying(AuthException.class,
                        exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        reviewService.update(popupStoreId, created.reviewId(),
                new ReviewRequestDto(3, "작성자가 평점을 수정한 리뷰입니다."), owner);
        assertThat(summaryRepository.findById(popupStoreId).orElseThrow().getAverageRating()).isEqualTo(3);
        reviewService.delete(popupStoreId, created.reviewId(), owner);
        var summary = summaryRepository.findById(popupStoreId).orElseThrow();
        assertThat(summary.getReviewCount()).isZero();
        assertThat(summary.getAverageRating()).isZero();
    }

    @Test
    void navigationVisitProducesVerifiedBadgeAndPublicResponseHidesIdentity() {
        visitService.record(owner, popupStoreId, new VisitRequestDto(VisitSource.NAVIGATION_ARRIVAL, null, "route"));
        ReviewResponseDto created = reviewService.create(popupStoreId,
                new ReviewRequestDto(4, "길안내 방문으로 확인된 리뷰입니다."), owner);

        assertThat(created.verifiedVisit()).isTrue();
        assertThat(ReviewResponseDto.class.getRecordComponents()).extracting(java.lang.reflect.RecordComponent::getName)
                .doesNotContain("email", "userId", "visitHistoryId");
        assertThat(reviewService.list(popupStoreId, "latest", PageRequest.of(0, 10), null).content())
                .singleElement().satisfies(review -> assertThat(review.mine()).isFalse());
    }

    @Test
    void ratingAndContentAreValidated() {
        visitService.record(owner, popupStoreId, new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, null, null));
        assertThatThrownBy(() -> reviewService.create(popupStoreId,
                new ReviewRequestDto(6, "평점 범위를 벗어나는 리뷰입니다."), owner)).isInstanceOf(AuthException.class);
        assertThatThrownBy(() -> reviewService.create(popupStoreId,
                new ReviewRequestDto(3, "짧음"), owner)).isInstanceOf(AuthException.class);
    }

    private static Authentication auth(Long userId) {
        Jwt jwt = Jwt.withTokenValue("test").header("alg", "none").subject(userId.toString())
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        return new UsernamePasswordAuthenticationToken(jwt, null);
    }
}
