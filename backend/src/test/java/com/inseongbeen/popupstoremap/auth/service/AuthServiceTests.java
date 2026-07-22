package com.inseongbeen.popupstoremap.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;

import com.inseongbeen.popupstoremap.auth.dto.LoginRequestDto;
import com.inseongbeen.popupstoremap.auth.dto.SignupRequestDto;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.auth.repository.AppUserRepository;
import com.inseongbeen.popupstoremap.auth.repository.RefreshTokenRepository;
import com.inseongbeen.popupstoremap.auth.security.JwtTokenService;

@SpringBootTest
class AuthServiceTests {
    @Autowired AuthService authService;
    @Autowired AppUserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtTokenService jwtTokenService;

    @AfterEach
    void cleanUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void signupNormalizesEmailAndStoresOnlyBcryptHash() {
        var response = authService.signup(new SignupRequestDto(
                "  MEMBER@Example.COM ", "test-password-123", "테스트회원"));

        var saved = userRepository.findByEmail("member@example.com").orElseThrow();
        assertThat(response.email()).isEqualTo("member@example.com");
        assertThat(saved.getPasswordHash()).isNotEqualTo("test-password-123");
        assertThat(passwordEncoder.matches("test-password-123", saved.getPasswordHash())).isTrue();
    }

    @Test
    void duplicateEmailReturnsConflict() {
        authService.signup(new SignupRequestDto("member@example.com", "test-password-123", "첫회원"));

        assertThatThrownBy(() -> authService.signup(
                new SignupRequestDto(" MEMBER@example.com ", "another-password", "둘째회원")))
                .isInstanceOfSatisfying(AuthException.class,
                        exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void loginUsesGenericFailureAndIssuesValidAccessToken() {
        var user = authService.signup(new SignupRequestDto("member@example.com", "test-password-123", "테스트회원"));
        var login = authService.login(new LoginRequestDto("member@example.com", "test-password-123", "anonymous-a"));

        var jwt = jwtTokenService.decoder().decode(login.response().accessToken());
        assertThat(jwt.getSubject()).isEqualTo(user.id().toString());
        assertThat(login.response().expiresIn()).isEqualTo(900);
        assertThatThrownBy(() -> authService.login(
                new LoginRequestDto("member@example.com", "wrong-password", null)))
                .isInstanceOfSatisfying(AuthException.class,
                        exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void refreshRotatesTokenAndRejectsThePreviousToken() {
        authService.signup(new SignupRequestDto("member@example.com", "test-password-123", "테스트회원"));
        var login = authService.login(new LoginRequestDto("member@example.com", "test-password-123", null));
        var refreshed = authService.refresh(login.refreshToken());

        assertThat(refreshed.refreshToken()).isNotEqualTo(login.refreshToken());
        assertThat(refreshTokenRepository.findAll()).hasSize(2)
                .allMatch(token -> !token.getTokenHash().equals(login.refreshToken()))
                .anyMatch(token -> token.getRevokedAt() != null && token.getReplacedByTokenId() != null);
        assertThatThrownBy(() -> authService.refresh(login.refreshToken()))
                .isInstanceOf(AuthException.class);
    }

    @Test
    void logoutIsIdempotentAndMeExposesNoPassword() {
        var signedUp = authService.signup(new SignupRequestDto(
                "member@example.com", "test-password-123", "테스트회원"));
        var login = authService.login(new LoginRequestDto("member@example.com", "test-password-123", null));
        Jwt principal = Jwt.withTokenValue("test")
                .header("alg", "none").subject(signedUp.id().toString())
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        var authentication = new UsernamePasswordAuthenticationToken(principal, null);

        var me = authService.me(authentication);
        authService.logout(authentication, login.refreshToken());
        authService.logout(authentication, login.refreshToken());

        assertThat(me.email()).isEqualTo("member@example.com");
        assertThat(refreshTokenRepository.findAll()).singleElement()
                .satisfies(token -> assertThat(token.getRevokedAt()).isNotNull());
    }
}
