package com.inseongbeen.popupstoremap.popupstore.engagement.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupLike;

public interface PopupLikeRepository extends JpaRepository<PopupLike, Long> {
    Optional<PopupLike> findByPopupStoreIdAndAnonymousVisitorId(Long popupStoreId, String anonymousVisitorId);
    boolean existsByPopupStoreIdAndAnonymousVisitorId(Long popupStoreId, String anonymousVisitorId);
    List<PopupLike> findAllByPopupStoreIdInAndAnonymousVisitorId(Collection<Long> popupStoreIds, String anonymousVisitorId);
    Optional<PopupLike> findByPopupStoreIdAndUserId(Long popupStoreId, Long userId);
    boolean existsByPopupStoreIdAndUserId(Long popupStoreId, Long userId);
    List<PopupLike> findAllByPopupStoreIdInAndUserId(Collection<Long> popupStoreIds, Long userId);
    List<PopupLike> findAllByAnonymousVisitorId(String anonymousVisitorId);

    @Query("""
            select popupLike.popupStoreId as popupStoreId, count(popupLike) as likeCount
            from PopupLike popupLike
            where popupLike.popupStoreId in :popupStoreIds and popupLike.createdAt >= :since
            group by popupLike.popupStoreId
            """)
    List<RecentLikeCount> countRecentLikes(
            @Param("popupStoreIds") Collection<Long> popupStoreIds,
            @Param("since") LocalDateTime since
    );

    interface RecentLikeCount {
        Long getPopupStoreId();
        long getLikeCount();
    }
}
