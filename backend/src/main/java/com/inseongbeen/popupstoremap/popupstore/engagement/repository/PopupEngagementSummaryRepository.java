package com.inseongbeen.popupstoremap.popupstore.engagement.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.inseongbeen.popupstoremap.popupstore.engagement.entity.PopupEngagementSummary;

public interface PopupEngagementSummaryRepository extends JpaRepository<PopupEngagementSummary, Long> {
    List<PopupEngagementSummary> findAllByPopupStoreIdIn(Collection<Long> popupStoreIds);
}
