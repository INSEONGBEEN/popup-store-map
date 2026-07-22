package com.inseongbeen.popupstoremap.favorite.service;

import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.security.CurrentUser;
import com.inseongbeen.popupstoremap.favorite.dto.FavoriteResponseDto;
import com.inseongbeen.popupstoremap.favorite.entity.PopupFavorite;
import com.inseongbeen.popupstoremap.favorite.repository.PopupFavoriteRepository;
import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;

@Service
@Transactional(readOnly = true)
public class PopupFavoriteService {
    private static final Set<String> ALLOWED_SORT = Set.of("createdAt", "id");
    private final PopupFavoriteRepository favoriteRepository;
    private final PopupStoreRepository popupStoreRepository;
    private final CurrentUser currentUser;

    public PopupFavoriteService(PopupFavoriteRepository favoriteRepository,
                                PopupStoreRepository popupStoreRepository, CurrentUser currentUser) {
        this.favoriteRepository = favoriteRepository;
        this.popupStoreRepository = popupStoreRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public FavoriteResponseDto add(Authentication authentication, Long popupStoreId) {
        AppUser user = currentUser.require(authentication);
        PopupFavorite existing = favoriteRepository.findByUserIdAndPopupStoreId(user.getId(), popupStoreId)
                .orElse(null);
        if (existing != null) return FavoriteResponseDto.from(existing);
        PopupStore popupStore = popupStoreRepository.findById(popupStoreId)
                .orElseThrow(() -> new PopupStoreNotFoundException(popupStoreId));
        try {
            return FavoriteResponseDto.from(favoriteRepository.saveAndFlush(new PopupFavorite(user, popupStore)));
        } catch (DataIntegrityViolationException exception) {
            return favoriteRepository.findByUserIdAndPopupStoreId(user.getId(), popupStoreId)
                    .map(FavoriteResponseDto::from).orElseThrow(() -> exception);
        }
    }

    @Transactional
    public void remove(Authentication authentication, Long popupStoreId) {
        AppUser user = currentUser.require(authentication);
        favoriteRepository.findByUserIdAndPopupStoreId(user.getId(), popupStoreId)
                .ifPresent(favoriteRepository::delete);
    }

    public PageResponseDto<FavoriteResponseDto> findMine(Authentication authentication, Pageable pageable) {
        AppUser user = currentUser.require(authentication);
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT.contains(order.getProperty())) {
                throw new IllegalArgumentException("Unsupported favorite sort property: " + order.getProperty());
            }
        }
        Pageable safe = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100), pageable.getSort());
        Page<FavoriteResponseDto> result = favoriteRepository.findAllByUserId(user.getId(), safe)
                .map(FavoriteResponseDto::from);
        return PageResponseDto.from(result);
    }
}
