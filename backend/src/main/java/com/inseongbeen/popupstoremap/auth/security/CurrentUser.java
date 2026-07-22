package com.inseongbeen.popupstoremap.auth.security;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.entity.UserStatus;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.auth.repository.AppUserRepository;

@Component
public class CurrentUser {
    private final AppUserRepository userRepository;

    public CurrentUser(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser require(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        try {
            AppUser user = userRepository.findById(Long.valueOf(jwt.getSubject()))
                    .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "인증 정보를 확인할 수 없습니다."));
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new AuthException(HttpStatus.FORBIDDEN, "사용할 수 없는 계정입니다.");
            }
            return user;
        } catch (NumberFormatException exception) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "인증 정보를 확인할 수 없습니다.");
        }
    }

    public Optional<AppUser> optional(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) return Optional.empty();
        return Optional.of(require(authentication));
    }
}
