package com.inseongbeen.popupstoremap.review.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.inseongbeen.popupstoremap.review.entity.PopupReviewSummary;

public interface PopupReviewSummaryRepository extends JpaRepository<PopupReviewSummary, Long> {
    List<PopupReviewSummary> findAllByPopupStoreIdIn(Collection<Long> popupStoreIds);
}
