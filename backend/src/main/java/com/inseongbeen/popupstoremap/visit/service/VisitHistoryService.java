package com.inseongbeen.popupstoremap.visit.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.auth.entity.AppUser;
import com.inseongbeen.popupstoremap.auth.exception.AuthException;
import com.inseongbeen.popupstoremap.auth.security.CurrentUser;
import com.inseongbeen.popupstoremap.popupstore.dto.PageResponseDto;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.exception.PopupStoreNotFoundException;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;
import com.inseongbeen.popupstoremap.visit.dto.VisitRequestDto;
import com.inseongbeen.popupstoremap.visit.dto.VisitResponseDto;
import com.inseongbeen.popupstoremap.visit.entity.VisitHistory;
import com.inseongbeen.popupstoremap.visit.entity.VisitSource;
import com.inseongbeen.popupstoremap.visit.repository.VisitHistoryRepository;

@Service
@Transactional(readOnly = true)
public class VisitHistoryService {
    private static final Set<String> ALLOWED_SORT = Set.of("visitedAt", "visitDate", "createdAt", "id");
    private final VisitHistoryRepository visitRepository;
    private final PopupStoreRepository popupStoreRepository;
    private final CurrentUser currentUser;

    public VisitHistoryService(VisitHistoryRepository visitRepository,
                               PopupStoreRepository popupStoreRepository, CurrentUser currentUser) {
        this.visitRepository = visitRepository;
        this.popupStoreRepository = popupStoreRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public VisitResponseDto record(Authentication authentication, Long popupStoreId, VisitRequestDto request) {
        AppUser user = currentUser.require(authentication);
        LocalDateTime visitedAt = request.visitedAt() == null ? LocalDateTime.now() : request.visitedAt();
        if (visitedAt.isAfter(LocalDateTime.now().plusMinutes(5))) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "미래의 방문 시각은 기록할 수 없습니다.");
        }
        VisitHistory existing = visitRepository.findByUserIdAndPopupStoreIdAndVisitDate(
                user.getId(), popupStoreId, visitedAt.toLocalDate()).orElse(null);
        if (existing != null) {
            if (request.source() == VisitSource.NAVIGATION_ARRIVAL) {
                existing.confirmNavigation(visitedAt, request.routeSessionId());
            }
            return VisitResponseDto.from(existing);
        }
        PopupStore store = popupStoreRepository.findById(popupStoreId)
                .orElseThrow(() -> new PopupStoreNotFoundException(popupStoreId));
        try {
            return VisitResponseDto.from(visitRepository.saveAndFlush(
                    new VisitHistory(user, store, visitedAt, request.source(), request.routeSessionId())));
        } catch (DataIntegrityViolationException exception) {
            return visitRepository.findByUserIdAndPopupStoreIdAndVisitDate(
                    user.getId(), popupStoreId, visitedAt.toLocalDate())
                    .map(VisitResponseDto::from).orElseThrow(() -> exception);
        }
    }

    public PageResponseDto<VisitResponseDto> findMine(Authentication authentication, LocalDate from,
                                                       LocalDate to, Pageable pageable) {
        AppUser user = currentUser.require(authentication);
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("from must be before or equal to to");
        }
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT.contains(order.getProperty())) {
                throw new IllegalArgumentException("Unsupported visit sort property: " + order.getProperty());
            }
        }
        Pageable safe = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100), pageable.getSort());
        return PageResponseDto.from(visitRepository.findMine(user.getId(), from, to, safe).map(VisitResponseDto::from));
    }
}
