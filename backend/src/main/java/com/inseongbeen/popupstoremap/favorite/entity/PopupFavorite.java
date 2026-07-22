package com.inseongbeen.popupstoremap.favorite.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;

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
import jakarta.persistence.Column;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "popup_favorite",
        uniqueConstraints = @UniqueConstraint(name = "uk_popup_favorite_user_store",
                columnNames = {"user_id", "popup_store_id"}),
        indexes = {
                @Index(name = "idx_popup_favorite_user_created", columnList = "user_id, created_at"),
                @Index(name = "idx_popup_favorite_store", columnList = "popup_store_id")
        })
public class PopupFavorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "popup_store_id", nullable = false)
    private PopupStore popupStore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PopupFavorite(AppUser user, PopupStore popupStore) {
        this.user = user;
        this.popupStore = popupStore;
    }
}
