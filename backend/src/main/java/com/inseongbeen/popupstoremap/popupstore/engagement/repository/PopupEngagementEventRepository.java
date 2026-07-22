package com.inseongbeen.popupstoremap.popupstore.engagement.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.inseongbeen.popupstoremap.popupstore.engagement.entity.EngagementEventType;
import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupEngagementEvent;

public interface PopupEngagementEventRepository extends JpaRepository<PopupEngagementEvent, Long> {
    boolean existsByPopupStoreIdAndSessionIdAndEventType(
            Long popupStoreId,
            String sessionId,
            EngagementEventType eventType
    );

    @Query("""
            select event.popupStoreId as popupStoreId,
                   event.eventType as eventType,
                   count(event) as eventCount
            from PopupEngagementEvent event
            where event.popupStoreId in :popupStoreIds and event.occurredAt >= :since
            group by event.popupStoreId, event.eventType
            """)
    List<RecentEventCount> countRecentEvents(
            @Param("popupStoreIds") Collection<Long> popupStoreIds,
            @Param("since") LocalDateTime since
    );

    interface RecentEventCount {
        Long getPopupStoreId();
        EngagementEventType getEventType();
        long getEventCount();
    }
}
