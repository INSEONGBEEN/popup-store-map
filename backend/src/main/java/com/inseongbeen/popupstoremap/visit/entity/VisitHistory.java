package com.inseongbeen.popupstoremap.visit.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "visit_history",
        uniqueConstraints = @UniqueConstraint(name = "uk_visit_user_store_date",
                columnNames = {"user_id", "popup_store_id", "visit_date"}),
        indexes = {
                @Index(name = "idx_visit_user_visited", columnList = "user_id, visited_at"),
                @Index(name = "idx_visit_store", columnList = "popup_store_id")
        })
public class VisitHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "popup_store_id", nullable = false)
    private PopupStore popupStore;

    @Column(name = "visited_at", nullable = false)
    private LocalDateTime visitedAt;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VisitSource source;

    @Column(name = "route_session_id", length = 64)
    private String routeSessionId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public VisitHistory(AppUser user, PopupStore popupStore, LocalDateTime visitedAt,
                        VisitSource source, String routeSessionId) {
        this.user = user;
        this.popupStore = popupStore;
        this.visitedAt = visitedAt;
        this.visitDate = visitedAt.toLocalDate();
        this.source = source;
        this.routeSessionId = routeSessionId;
    }

    public void confirmNavigation(LocalDateTime time, String routeSessionId) {
        if (source == VisitSource.NAVIGATION_ARRIVAL) return;
        this.source = VisitSource.NAVIGATION_ARRIVAL;
        this.visitedAt = time;
        this.routeSessionId = routeSessionId;
    }
}
