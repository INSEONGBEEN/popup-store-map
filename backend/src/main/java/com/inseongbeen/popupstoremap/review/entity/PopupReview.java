package com.inseongbeen.popupstoremap.review.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.visit.entity.VisitHistory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "popup_review",
        uniqueConstraints = @UniqueConstraint(name = "uk_review_user_store",
                columnNames = {"user_id", "popup_store_id"}),
        indexes = {
                @Index(name = "idx_review_store_created", columnList = "popup_store_id, created_at"),
                @Index(name = "idx_review_user", columnList = "user_id"),
                @Index(name = "idx_review_visit", columnList = "visit_history_id")
        })
public class PopupReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "popup_store_id", nullable = false)
    private PopupStore popupStore;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visit_history_id", nullable = false)
    private VisitHistory visitHistory;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 1000)
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PopupReview(AppUser user, PopupStore popupStore, VisitHistory visitHistory, int rating, String content) {
        this.user = user;
        this.popupStore = popupStore;
        this.visitHistory = visitHistory;
        this.rating = rating;
        this.content = content;
    }

    public int update(int nextRating, String nextContent) {
        int previous = rating;
        rating = nextRating;
        content = nextContent;
        return previous;
    }
}
