package com.inseongbeen.popupstoremap.popupstore.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;

@DataJpaTest
class PopupStoreSearchRepositoryTests {

    @Autowired
    private PopupStoreRepository popupStoreRepository;

    @BeforeEach
    void setUp() {
        popupStoreRepository.save(createPopupStore(
                "성수 패션 팝업", LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                PopupStoreCategory.FASHION, PopupStoreStatus.OPEN
        ));
        popupStoreRepository.save(createPopupStore(
                "Seongsu Beauty", LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31),
                PopupStoreCategory.BEAUTY, PopupStoreStatus.UPCOMING
        ));
        popupStoreRepository.save(createPopupStore(
                "성수 푸드 팝업", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                PopupStoreCategory.FOOD, PopupStoreStatus.CLOSED
        ));
        popupStoreRepository.save(createPopupStore(
                "한남 패션 팝업", LocalDate.of(2026, 7, 21), LocalDate.of(2026, 7, 21),
                PopupStoreCategory.FASHION, PopupStoreStatus.OPEN
        ));
        popupStoreRepository.flush();
    }

    @Test
    void searchWithoutConditions() {
        Page<PopupStore> result = search(null, null, null, null, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(4);
    }

    @Test
    void searchByNameIgnoringCase() {
        Page<PopupStore> result = search("SEONGSU", null, null, null, PageRequest.of(0, 10));

        assertThat(result.getContent())
                .extracting(PopupStore::getName)
                .containsExactly("Seongsu Beauty");
    }

    @Test
    void searchByCategory() {
        Page<PopupStore> result = search(
                null, PopupStoreCategory.FASHION, null, null, PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PopupStore::getName)
                .containsExactlyInAnyOrder("성수 패션 팝업", "한남 패션 팝업");
    }

    @Test
    void searchByStatus() {
        Page<PopupStore> result = search(
                null, null, PopupStoreStatus.CLOSED, null, PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PopupStore::getName)
                .containsExactly("성수 푸드 팝업");
    }

    @Test
    void searchByOperatingDateIncludesBoundaries() {
        Page<PopupStore> result = search(
                null, null, null, LocalDate.of(2026, 7, 21), PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PopupStore::getName)
                .containsExactlyInAnyOrder("성수 패션 팝업", "한남 패션 팝업");
    }

    @Test
    void searchByCombinedConditions() {
        Page<PopupStore> result = search(
                " 성수 ", PopupStoreCategory.FASHION, PopupStoreStatus.OPEN,
                LocalDate.of(2026, 7, 21), PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PopupStore::getName)
                .containsExactly("성수 패션 팝업");
    }

    @Test
    void searchReturnsEmptyPage() {
        Page<PopupStore> result = search("없는 이름", null, null, null, PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    void searchUsesPagination() {
        Page<PopupStore> result = search(null, null, null, null, PageRequest.of(1, 2));

        assertThat(result.getNumber()).isEqualTo(1);
        assertThat(result.getSize()).isEqualTo(2);
        assertThat(result.getNumberOfElements()).isEqualTo(2);
        assertThat(result.getTotalElements()).isEqualTo(4);
    }

    @Test
    void searchUsesSorting() {
        Page<PopupStore> result = search(
                null, null, null, null,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "startDate"))
        );

        assertThat(result.getContent())
                .extracting(PopupStore::getStartDate)
                .isSortedAccordingTo((left, right) -> right.compareTo(left));
    }

    private Page<PopupStore> search(
            String keyword,
            PopupStoreCategory category,
            PopupStoreStatus status,
            LocalDate operatingDate,
            PageRequest pageRequest
    ) {
        return popupStoreRepository.findAll(
                PopupStoreSpecification.search(keyword, category, status, operatingDate),
                pageRequest
        );
    }

    private PopupStore createPopupStore(
            String name,
            LocalDate startDate,
            LocalDate endDate,
            PopupStoreCategory category,
            PopupStoreStatus status
    ) {
        return new PopupStore(
                name,
                "서울특별시 성동구",
                37.5432,
                127.0557,
                startDate,
                endDate,
                category,
                status,
                null,
                null
        );
    }
}
