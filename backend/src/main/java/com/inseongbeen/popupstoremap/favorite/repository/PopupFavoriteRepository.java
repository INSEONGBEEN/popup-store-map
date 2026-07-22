package com.inseongbeen.popupstoremap.favorite.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.inseongbeen.popupstoremap.favorite.entity.PopupFavorite;

public interface PopupFavoriteRepository extends JpaRepository<PopupFavorite, Long> {
    boolean existsByUserIdAndPopupStoreId(Long userId, Long popupStoreId);
    Optional<PopupFavorite> findByUserIdAndPopupStoreId(Long userId, Long popupStoreId);

    @EntityGraph(attributePaths = "popupStore")
    Page<PopupFavorite> findAllByUserId(Long userId, Pageable pageable);
}
