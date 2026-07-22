package com.inseongbeen.popupstoremap.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.auth.config.AuthProperties;
import com.inseongbeen.popupstoremap.auth.dto.AuthResponseDto;
import com.inseongbeen.popupstoremap.auth.dto.LoginRequestDto;
import com.inseongbeen.popupstoremap.auth.dto.SignupRequestDto;
import com.inseongbeen.popupstoremap.auth.dto.UserResponseDto;
import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.entity.RefreshToken;
import com.inseongbeen.popupstoremap.auth.entity.UserStatus;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.auth.repository.AppUserRepository;
import com.inseongbeen.popupstoremap.auth.repository.RefreshTokenRepository;
import com.inseongbeen.popupstoremap.auth.security.CurrentUser;
import com.inseongbeen.popupstoremap.auth.security.JwtTokenService;

@Service
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AppUserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokens;
    private final AuthProperties properties;
    private final CurrentUser currentUser;

    public AuthService(AppUserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, JwtTokenService jwtTokens,
                       AuthProperties properties, CurrentUser currentUser) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokens = jwtTokens;
        this.properties = properties;
        this.currentUser = currentUser;
    }

    @Transactional
    public UserResponseDto signup(SignupRequestDto request) {
        String email = normalizeEmail(request.email());
        String nickname = request.nickname().trim();
        if (nickname.length() < 2 || nickname.length() > 20) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "닉네임은 2자 이상 20자 이하여야 합니다.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }
        try {
            AppUser user = userRepository.saveAndFlush(
                    new AppUser(email, passwordEncoder.encode(request.password()), nickname));
            return UserResponseDto.from(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }
    }

    @Transactional
    public AuthTokens login(LoginRequestDto request) {
        String email = normalizeEmail(request.email());
        AppUser user = userRepository.findByEmail(email)
                .filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인해 주세요."));
        user.recordLogin(LocalDateTime.now());
        return issueTokens(user);
    }

    @Transactional
    public AuthTokens refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "로그인 세션이 만료되었습니다.");
        }
        LocalDateTime now = LocalDateTime.now();
        RefreshToken current = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .filter(token -> token.isUsableAt(now))
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "로그인 세션이 만료되었습니다."));

        String nextRawToken = newRawRefreshToken();
        RefreshToken replacement = refreshTokenRepository.saveAndFlush(new RefreshToken(
                current.getUser(), hash(nextRawToken), now.plus(properties.refreshTokenTtl())));
        current.revoke(now, replacement.getId());
        return new AuthTokens(accessResponse(current.getUser()), nextRawToken);
    }

    @Transactional
    public void logout(Authentication authentication, String rawRefreshToken) {
        AppUser user = currentUser.require(authentication);
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .filter(token -> token.getUser().getId().equals(user.getId()))
                .filter(token -> token.getRevokedAt() == null)
                .ifPresent(token -> token.revoke(LocalDateTime.now(), null));
    }

    @Transactional(readOnly = true)
    public UserResponseDto me(Authentication authentication) {
        return UserResponseDto.from(currentUser.require(authentication));
    }

    private AuthTokens issueTokens(AppUser user) {
        String rawRefreshToken = newRawRefreshToken();
        refreshTokenRepository.save(new RefreshToken(
                user, hash(rawRefreshToken), LocalDateTime.now().plus(properties.refreshTokenTtl())));
        return new AuthTokens(accessResponse(user), rawRefreshToken);
    }

    private AuthResponseDto accessResponse(AppUser user) {
        return new AuthResponseDto(jwtTokens.createAccessToken(user),
                properties.accessTokenTtl().toSeconds(), UserResponseDto.from(user));
    }

    static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String newRawRefreshToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
