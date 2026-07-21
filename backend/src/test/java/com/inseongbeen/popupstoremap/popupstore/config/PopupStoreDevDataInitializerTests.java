package com.inseongbeen.popupstoremap.popupstore.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.ApplicationArguments;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;

class PopupStoreDevDataInitializerTests {

    @Test
    void insertsEighteenSamplesOnFirstRun() {
        PopupStoreRepository repository = mock(PopupStoreRepository.class);
        when(repository.existsByName(anyString())).thenReturn(false);
        PopupStoreDevDataInitializer initializer = new PopupStoreDevDataInitializer(repository);

        initializer.run(mock(ApplicationArguments.class));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PopupStore>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(18);
        assertThat(captor.getValue())
                .extracting(PopupStore::getName)
                .allMatch(name -> name.startsWith("[DEV]"));
        assertStatusesMatchReferenceDate(captor.getValue());
    }

    @Test
    void skipsExistingSamplesOnRestart() {
        PopupStoreRepository repository = mock(PopupStoreRepository.class);
        when(repository.existsByName(anyString())).thenReturn(true);
        PopupStoreDevDataInitializer initializer = new PopupStoreDevDataInitializer(repository);

        initializer.run(mock(ApplicationArguments.class));

        verify(repository, never()).saveAll(anyList());
    }

    private void assertStatusesMatchReferenceDate(List<PopupStore> samples) {
        LocalDate referenceDate = LocalDate.of(2026, 7, 21);

        assertThat(samples).allSatisfy(sample -> {
            if (sample.getStatus() == PopupStoreStatus.OPEN) {
                assertThat(sample.getStartDate()).isBeforeOrEqualTo(referenceDate);
                assertThat(sample.getEndDate()).isAfterOrEqualTo(referenceDate);
            } else if (sample.getStatus() == PopupStoreStatus.UPCOMING) {
                assertThat(sample.getStartDate()).isAfter(referenceDate);
            } else {
                assertThat(sample.getEndDate()).isBefore(referenceDate);
            }
        });
    }
}
