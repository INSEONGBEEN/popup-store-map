package com.inseongbeen.popupstoremap.review.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.inseongbeen.popupstoremap.review.entity.PopupReview;

public interface PopupReviewRepository extends JpaRepository<PopupReview, Long> {
    boolean existsByUserIdAndPopupStoreId(Long userId, Long popupStoreId);
    Optional<PopupReview> findByUserIdAndPopupStoreId(Long userId, Long popupStoreId);

    @EntityGraph(attributePaths = {"user", "visitHistory"})
    Page<PopupReview> findAllByPopupStoreId(Long popupStoreId, Pageable pageable);

    @EntityGraph(attributePaths = {"popupStore", "visitHistory", "user"})
    Page<PopupReview> findAllByUserId(Long userId, Pageable pageable);
}
