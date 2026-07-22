package com.inseongbeen.popupstoremap.visit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import com.inseongbeen.popupstoremap.auth.dto.SignupRequestDto;
import com.inseongbeen.popupstoremap.auth.repository.AppUserRepository;
import com.inseongbeen.popupstoremap.auth.repository.RefreshTokenRepository;
import com.inseongbeen.popupstoremap.auth.service.AuthService;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.visit.dto.VisitRequestDto;
import com.inseongbeen.popupstoremap.visit.entity.VisitSource;
import com.inseongbeen.popupstoremap.visit.repository.VisitHistoryRepository;
import com.inseongbeen.popupstoremap.visit.service.VisitHistoryService;

@SpringBootTest
class VisitHistoryServiceTests {
    @Autowired VisitHistoryService visitService;
    @Autowired VisitHistoryRepository visitRepository;
    @Autowired PopupStoreRepository popupStoreRepository;
    @Autowired AppUserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired AuthService authService;

    private Long popupStoreId;
    private Authentication firstUser;
    private Authentication secondUser;

    @BeforeEach
    void setUp() {
        popupStoreId = popupStoreRepository.saveAndFlush(new PopupStore(
                "방문 테스트", "서울 성동구", 37.54, 127.05,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1),
                PopupStoreCategory.FOOD, PopupStoreStatus.OPEN, null, null)).getId();
        firstUser = auth(authService.signup(new SignupRequestDto(
                "visit-a@example.com", "test-password-123", "방문회원A")).id());
        secondUser = auth(authService.signup(new SignupRequestDto(
                "visit-b@example.com", "test-password-123", "방문회원B")).id());
    }

    @AfterEach
    void cleanUp() {
        visitRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
        popupStoreRepository.deleteAll();
    }

    @Test
    void sameDateIsIdempotentButDifferentDatesAreAllowed() {
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1).withHour(10);
        visitService.record(firstUser, popupStoreId,
                new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, yesterday, null));
        visitService.record(firstUser, popupStoreId,
                new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, yesterday.plusHours(3), null));
        visitService.record(firstUser, popupStoreId,
                new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, LocalDateTime.now(), null));

        assertThat(visitRepository.count()).isEqualTo(2);
    }

    @Test
    void navigationArrivalUpgradesManualVisitAndUsersRemainIsolated() {
        visitService.record(firstUser, popupStoreId,
                new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, null, null));
        var upgraded = visitService.record(firstUser, popupStoreId,
                new VisitRequestDto(VisitSource.NAVIGATION_ARRIVAL, null, "route-session"));
        visitService.record(secondUser, popupStoreId,
                new VisitRequestDto(VisitSource.MANUAL_CONFIRMATION, null, null));

        assertThat(upgraded.source()).isEqualTo(VisitSource.NAVIGATION_ARRIVAL);
        assertThat(visitRepository.count()).isEqualTo(2);
        assertThat(visitService.findMine(firstUser, null, null, page()).content()).hasSize(1);
        assertThat(visitService.findMine(secondUser, null, null, page()).content()).hasSize(1);
    }

    @Test
    void entityDoesNotPersistLocationOrRouteGeometry() {
        assertThat(java.util.Arrays.stream(com.inseongbeen.popupstoremap.visit.entity.VisitHistory.class.getDeclaredFields())
                .map(java.lang.reflect.Field::getName))
                .doesNotContain("latitude", "longitude", "coordinates", "routeGeometry", "heading");
    }

    private static PageRequest page() {
        return PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "visitedAt"));
    }

    private static Authentication auth(Long userId) {
        Jwt jwt = Jwt.withTokenValue("test").header("alg", "none").subject(userId.toString())
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        return new UsernamePasswordAuthenticationToken(jwt, null);
    }
}
