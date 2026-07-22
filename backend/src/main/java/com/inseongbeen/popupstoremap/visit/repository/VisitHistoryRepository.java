package com.inseongbeen.popupstoremap.visit.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.inseongbeen.popupstoremap.visit.entity.VisitHistory;

public interface VisitHistoryRepository extends JpaRepository<VisitHistory, Long> {
    Optional<VisitHistory> findByUserIdAndPopupStoreIdAndVisitDate(Long userId, Long popupStoreId, LocalDate visitDate);
    boolean existsByUserIdAndPopupStoreId(Long userId, Long popupStoreId);
    Optional<VisitHistory> findTopByUserIdAndPopupStoreIdOrderByVisitedAtDesc(Long userId, Long popupStoreId);
    boolean existsByUserIdAndPopupStoreIdAndSource(Long userId, Long popupStoreId,
                                                   com.inseongbeen.popupstoremap.visit.entity.VisitSource source);

    @EntityGraph(attributePaths = "popupStore")
    @Query("""
            select visit from VisitHistory visit
            where visit.user.id = :userId
              and (:fromDate is null or visit.visitDate >= :fromDate)
              and (:toDate is null or visit.visitDate <= :toDate)
            """)
    Page<VisitHistory> findMine(@Param("userId") Long userId,
                                @Param("fromDate") LocalDate fromDate,
                                @Param("toDate") LocalDate toDate,
                                Pageable pageable);
}
