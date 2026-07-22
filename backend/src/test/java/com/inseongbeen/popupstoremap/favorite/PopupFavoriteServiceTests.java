package com.inseongbeen.popupstoremap.favorite;

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
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import com.inseongbeen.popupstoremap.auth.dto.SignupRequestDto;
import com.inseongbeen.popupstoremap.auth.repository.AppUserRepository;
import com.inseongbeen.popupstoremap.auth.repository.RefreshTokenRepository;
import com.inseongbeen.popupstoremap.auth.service.AuthService;
import com.inseongbeen.popupstoremap.favorite.repository.PopupFavoriteRepository;
import com.inseongbeen.popupstoremap.favorite.service.PopupFavoriteService;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.popupstore.service.PopupStoreService;

@SpringBootTest
class PopupFavoriteServiceTests {
    @Autowired PopupFavoriteService favoriteService;
    @Autowired PopupFavoriteRepository favoriteRepository;
    @Autowired PopupStoreRepository popupStoreRepository;
    @Autowired PopupStoreService popupStoreService;
    @Autowired AppUserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired AuthService authService;

    private Long popupStoreId;
    private Authentication firstUser;
    private Authentication secondUser;

    @BeforeEach
    void setUp() {
        PopupStore store = new PopupStore("즐겨찾기 테스트", "서울 성동구", 37.54, 127.05,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 1),
                PopupStoreCategory.FASHION, PopupStoreStatus.OPEN, null, null);
        popupStoreId = popupStoreRepository.saveAndFlush(store).getId();
        firstUser = authentication(authService.signup(new SignupRequestDto(
                "favorite-a@example.com", "test-password-123", "첫회원")).id());
        secondUser = authentication(authService.signup(new SignupRequestDto(
                "favorite-b@example.com", "test-password-123", "둘회원")).id());
    }

    @AfterEach
    void cleanUp() {
        favoriteRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
        popupStoreRepository.deleteAll();
    }

    @Test
    void addIsIdempotentAndUsersAreIsolated() {
        favoriteService.add(firstUser, popupStoreId);
        favoriteService.add(firstUser, popupStoreId);
        favoriteService.add(secondUser, popupStoreId);

        assertThat(favoriteRepository.count()).isEqualTo(2);
        assertThat(favoriteService.findMine(firstUser, page()).content()).hasSize(1);
        assertThat(favoriteService.findMine(secondUser, page()).content()).hasSize(1);
    }

    @Test
    void removeIsIdempotentAndDoesNotRemoveAnotherUsersFavorite() {
        favoriteService.add(firstUser, popupStoreId);
        favoriteService.add(secondUser, popupStoreId);

        favoriteService.remove(firstUser, popupStoreId);
        favoriteService.remove(firstUser, popupStoreId);

        assertThat(favoriteService.findMine(firstUser, page()).content()).isEmpty();
        assertThat(favoriteService.findMine(secondUser, page()).content()).hasSize(1);
    }

    @Test
    void missingPopupIsRejected() {
        assertThatThrownBy(() -> favoriteService.add(firstUser, Long.MAX_VALUE))
                .isInstanceOf(PopupStoreNotFoundException.class);
    }

    @Test
    void popupResponseContainsBatchLoadedPersonalizationForCurrentUser() {
        favoriteService.add(firstUser, popupStoreId);

        Long firstUserId = Long.valueOf(((Jwt) firstUser.getPrincipal()).getSubject());
        var signedIn = popupStoreService.findById(popupStoreId, null, firstUserId);
        var anonymous = popupStoreService.findById(popupStoreId, null, null);

        assertThat(signedIn.personalization().favoritedByCurrentUser()).isTrue();
        assertThat(signedIn.personalization().visitedByCurrentUser()).isFalse();
        assertThat(signedIn.personalization().reviewedByCurrentUser()).isFalse();
        assertThat(anonymous.personalization().favoritedByCurrentUser()).isFalse();
    }

    private static PageRequest page() {
        return PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private static Authentication authentication(Long userId) {
        Jwt jwt = Jwt.withTokenValue("test").header("alg", "none").subject(userId.toString())
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        return new UsernamePasswordAuthenticationToken(jwt, null);
    }
}
