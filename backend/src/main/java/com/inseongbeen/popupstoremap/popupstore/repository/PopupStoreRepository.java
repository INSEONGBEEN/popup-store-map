package com.inseongbeen.popupstoremap.popupstore.repository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;

import jakarta.persistence.LockModeType;

public interface PopupStoreRepository extends
        JpaRepository<PopupStore, Long>,
        JpaSpecificationExecutor<PopupStore> {

    Optional<PopupStore> findByName(String name);

    List<PopupStore> findAllByStatusIn(Collection<PopupStoreStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select popupStore from PopupStore popupStore where popupStore.id = :id")
    Optional<PopupStore> findByIdForUpdate(@Param("id") Long id);
}
