package com.inseongbeen.popupstoremap.popupstore.engagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.inseongbeen.popupstoremap.popupstore.engagement.dto.EngagementEventRequestDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.dto.LikeRequestDto;
import com.inseongbeen.popupstoremap.popupstore.engagement.repository.PopupEngagementEventRepository;
import com.inseongbeen.popupstoremap.popupstore.engagement.repository.PopupEngagementSummaryRepository;
import com.inseongbeen.popupstoremap.popupstore.engagement.repository.PopupLikeRepository;
import com.inseongbeen.popupstoremap.popupstore.engagement.service.PopupEngagementService;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.popupstore.service.PopupStoreService;

@SpringBootTest
class PopupEngagementServiceTests {

    @Autowired PopupEngagementService engagementService;
    @Autowired PopupStoreService popupStoreService;
    @Autowired PopupStoreRepository popupStoreRepository;
    @Autowired PopupEngagementEventRepository eventRepository;
    @Autowired PopupEngagementSummaryRepository summaryRepository;
    @Autowired PopupLikeRepository likeRepository;

    private Long popupStoreId;

    @BeforeEach
    void setUp() {
        PopupStore store = new PopupStore(
                "참여 테스트 팝업", "서울특별시 성동구 성수동", 37.54, 127.05,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1),
                PopupStoreCategory.FASHION, PopupStoreStatus.OPEN, null, null
        );
        popupStoreId = popupStoreRepository.saveAndFlush(store).getId();
    }

    @AfterEach
    void cleanUp() {
        eventRepository.deleteAll();
        likeRepository.deleteAll();
        summaryRepository.deleteAll();
        popupStoreRepository.deleteAll();
    }

    @Test
    void sameSessionViewAndPlanAddAreIdempotentButDifferentSessionsCount() {
        var first = new EngagementEventRequestDto("visitor-a", "session-a");
        engagementService.recordView(popupStoreId, first);
        engagementService.recordView(popupStoreId, first);
        engagementService.recordPlanAdd(popupStoreId, first);
        engagementService.recordPlanAdd(popupStoreId, first);
        var result = engagementService.recordView(
                popupStoreId, new EngagementEventRequestDto("visitor-a", "session-b"));

        assertThat(result.viewCount()).isEqualTo(2);
        assertThat(result.planAddCount()).isEqualTo(1);
    }

    @Test
    void likeAndUnlikeAreIdempotent() {
        var request = new LikeRequestDto("visitor-a");
        engagementService.like(popupStoreId, request);
        var liked = engagementService.like(popupStoreId, request);
        assertThat(liked.likeCount()).isEqualTo(1);
        assertThat(liked.likedByCurrentVisitor()).isTrue();

        engagementService.unlike(popupStoreId, request);
        var unliked = engagementService.unlike(popupStoreId, request);
        assertThat(unliked.likeCount()).isZero();
        assertThat(unliked.likedByCurrentVisitor()).isFalse();
    }

    @Test
    void listLoadsSummaryAndVisitorLikeWithoutPerCardRequests() {
        engagementService.recordView(popupStoreId, new EngagementEventRequestDto("visitor-a", "session-a"));
        engagementService.like(popupStoreId, new LikeRequestDto("visitor-a"));

        var response = popupStoreService.findAll("visitor-a").stream()
                .filter(store -> store.id().equals(popupStoreId))
                .findFirst().orElseThrow();

        assertThat(response.engagement().viewCount()).isEqualTo(1);
        assertThat(response.engagement().likeCount()).isEqualTo(1);
        assertThat(response.engagement().likedByCurrentVisitor()).isTrue();
    }

    @Test
    void missingPopupIsRejected() {
        assertThatThrownBy(() -> engagementService.like(999_999L, new LikeRequestDto("visitor-a")))
                .isInstanceOf(PopupStoreNotFoundException.class);
    }

    @Test
    void concurrentViewEventsRemainConsistent() throws Exception {
        int requestCount = 8;
        var pool = Executors.newFixedThreadPool(requestCount);
        var ready = new CountDownLatch(requestCount);
        var start = new CountDownLatch(1);
        var done = new CountDownLatch(requestCount);
        for (int index = 0; index < requestCount; index++) {
            int sessionIndex = index;
            pool.submit(() -> {
                ready.countDown();
                try {
                    start.await();
                    engagementService.recordView(popupStoreId,
                            new EngagementEventRequestDto("visitor-a", "session-" + sessionIndex));
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        assertThat(ready.await(3, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        assertThat(done.await(8, TimeUnit.SECONDS)).isTrue();
        pool.shutdownNow();

        var summaries = engagementService.summaries(List.of(popupStoreId), "visitor-a");
        assertThat(summaries.get(popupStoreId).viewCount()).isEqualTo(requestCount);
    }

    @Test
    void featuredRankingUsesRecentMetricsExcludesClosedAndAppliesLimit() {
        Long viewedId = saveStore("조회 인기 팝업", PopupStoreStatus.OPEN);
        Long plannedId = saveStore("일정 인기 팝업", PopupStoreStatus.UPCOMING);
        Long closedId = saveStore("종료 인기 팝업", PopupStoreStatus.CLOSED);
        for (int index = 0; index < 4; index++) {
            engagementService.recordView(viewedId,
                    new EngagementEventRequestDto("viewer-" + index, "view-session-" + index));
            engagementService.recordPlanAdd(closedId,
                    new EngagementEventRequestDto("closed-" + index, "closed-session-" + index));
        }
        engagementService.recordPlanAdd(plannedId,
                new EngagementEventRequestDto("planner-a", "plan-session-a"));
        engagementService.recordPlanAdd(plannedId,
                new EngagementEventRequestDto("planner-b", "plan-session-b"));
        engagementService.like(plannedId, new LikeRequestDto("liker-a"));

        var featured = popupStoreService.findFeatured(2, "liker-a");

        assertThat(featured).hasSize(2);
        assertThat(featured.getFirst().id()).isEqualTo(plannedId);
        assertThat(featured).extracting(store -> store.id()).doesNotContain(closedId);
        assertThat(featured.getFirst().engagement().likedByCurrentVisitor()).isTrue();
    }

    @Test
    void featuredWithoutEngagementPrefersOpenThenRecentId() {
        Long olderOpenId = saveStore("기본 운영 팝업 A", PopupStoreStatus.OPEN);
        Long newerOpenId = saveStore("기본 운영 팝업 B", PopupStoreStatus.OPEN);
        Long upcomingId = saveStore("기본 예정 팝업", PopupStoreStatus.UPCOMING);

        var featured = popupStoreService.findFeatured(20, null);

        var ids = featured.stream().map(store -> store.id()).toList();
        assertThat(ids.indexOf(newerOpenId)).isLessThan(ids.indexOf(olderOpenId));
        assertThat(ids.indexOf(olderOpenId)).isLessThan(ids.indexOf(upcomingId));
    }

    private Long saveStore(String name, PopupStoreStatus status) {
        return popupStoreRepository.saveAndFlush(new PopupStore(
                name, "서울특별시 성동구 성수동", 37.54, 127.05,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1),
                PopupStoreCategory.FASHION, status, null, null
        )).getId();
    }
}
