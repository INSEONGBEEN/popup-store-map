package com.inseongbeen.popupstoremap.popupstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;

public interface PopupStoreRepository extends
        JpaRepository<PopupStore, Long>,
        JpaSpecificationExecutor<PopupStore> {

    boolean existsByName(String name);
}
