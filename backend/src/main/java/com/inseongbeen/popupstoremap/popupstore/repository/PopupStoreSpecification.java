package com.inseongbeen.popupstoremap.popupstore.repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;

import jakarta.persistence.criteria.Predicate;

public final class PopupStoreSpecification {

    private PopupStoreSpecification() {
    }

    public static Specification<PopupStore> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + escapeLike(keyword.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        pattern,
                        '\\'
                ));
            }

            if (category != null) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (operatingDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), operatingDate));
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), operatingDate));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
