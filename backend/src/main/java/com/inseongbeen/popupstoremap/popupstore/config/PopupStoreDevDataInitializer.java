package com.inseongbeen.popupstoremap.popupstore.config;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.inseongbeen.popupstoremap.popupstore.entity.PopupStore;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreCategory;
import com.inseongbeen.popupstoremap.popupstore.entity.PopupStoreStatus;
import com.inseongbeen.popupstoremap.popupstore.repository.PopupStoreRepository;

import lombok.RequiredArgsConstructor;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class PopupStoreDevDataInitializer implements ApplicationRunner {

    private final PopupStoreRepository popupStoreRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<PopupStore> missingSamples = samples().stream()
                .filter(sample -> !popupStoreRepository.existsByName(sample.getName()))
                .toList();

        if (!missingSamples.isEmpty()) {
            popupStoreRepository.saveAll(missingSamples);
        }
    }

    private List<PopupStore> samples() {
        return List.of(
                sample("[DEV] 성수 여름 패션 랩", "서울특별시 성동구 아차산로 100 (개발용 위치)",
                        37.54462, 127.05608, "2026-07-01", "2026-07-31", FASHION, OPEN),
                sample("[DEV] 성수 뷰티 컬러 스튜디오", "서울특별시 성동구 연무장길 15 (개발용 위치)",
                        37.54288, 127.05431, "2026-07-15", "2026-08-15", BEAUTY, OPEN),
                sample("[DEV] 성수 캐릭터 플레이룸", "서울특별시 성동구 연무장7길 8 (개발용 위치)",
                        37.54173, 127.05242, "2026-07-21", "2026-08-09", CHARACTER, OPEN),
                sample("[DEV] 성수 디저트 테이블", "서울특별시 성동구 성수이로 72 (개발용 위치)",
                        37.54314, 127.05791, "2026-07-10", "2026-07-24", FOOD, OPEN),
                sample("[DEV] 성수 리빙 큐레이션", "서울특별시 성동구 성수이로7길 26 (개발용 위치)",
                        37.54571, 127.05376, "2026-07-20", "2026-08-20", LIFESTYLE, OPEN),
                sample("[DEV] 성수 크리에이터 마켓", "서울특별시 성동구 연무장13길 5 (개발용 위치)",
                        37.54401, 127.05944, "2026-07-21", "2026-07-21", ETC, OPEN),
                sample("[DEV] 서울숲 패션 아카이브", "서울특별시 성동구 서울숲2길 20 (개발용 위치)",
                        37.54677, 127.04182, "2026-08-01", "2026-08-31", FASHION, UPCOMING),
                sample("[DEV] 서울숲 비건 뷰티바", "서울특별시 성동구 서울숲4길 18 (개발용 위치)",
                        37.54794, 127.04367, "2026-07-28", "2026-08-17", BEAUTY, UPCOMING),
                sample("[DEV] 서울숲 브런치 페어", "서울특별시 성동구 서울숲6길 12 (개발용 위치)",
                        37.54913, 127.04489, "2026-08-05", "2026-08-23", FOOD, UPCOMING),
                sample("[DEV] 서울숲 캐릭터 가든", "서울특별시 성동구 왕십리로 83 (개발용 위치)",
                        37.54396, 127.04403, "2026-09-01", "2026-09-20", CHARACTER, UPCOMING),
                sample("[DEV] 서울숲 홈 오피스 쇼룸", "서울특별시 성동구 서울숲길 40 (개발용 위치)",
                        37.54835, 127.04258, "2026-08-14", "2026-09-06", LIFESTYLE, UPCOMING),
                sample("[DEV] 뚝섬 스니커즈 클럽", "서울특별시 성동구 상원길 30 (개발용 위치)",
                        37.54723, 127.04791, "2026-06-01", "2026-06-21", FASHION, CLOSED),
                sample("[DEV] 뚝섬 향기 연구소", "서울특별시 성동구 상원2길 6 (개발용 위치)",
                        37.54619, 127.04942, "2026-06-15", "2026-07-05", BEAUTY, CLOSED),
                sample("[DEV] 뚝섬 아이스크림 위크", "서울특별시 성동구 뚝섬로 302 (개발용 위치)",
                        37.53891, 127.05213, "2026-07-01", "2026-07-20", FOOD, CLOSED),
                sample("[DEV] 뚝섬 토이 컬렉션", "서울특별시 성동구 성수일로 45 (개발용 위치)",
                        37.54502, 127.05067, "2026-05-10", "2026-06-10", CHARACTER, CLOSED),
                sample("[DEV] 뚝섬 캠핑 라이프", "서울특별시 성동구 성수일로8길 9 (개발용 위치)",
                        37.54763, 127.05141, "2026-06-20", "2026-07-10", LIFESTYLE, CLOSED),
                sample("[DEV] 연무장 아트 북숍", "서울특별시 성동구 연무장길 50 (개발용 위치)",
                        37.54119, 127.05863, "2026-07-18", "2026-08-02", ETC, OPEN),
                sample("[DEV] 성수 미래 브랜드 쇼케이스", "서울특별시 성동구 광나루로 270 (개발용 위치)",
                        37.54851, 127.06112, "2026-08-20", "2026-09-13", ETC, UPCOMING)
        );
    }

    private PopupStore sample(
            String name,
            String address,
            double latitude,
            double longitude,
            String startDate,
            String endDate,
            PopupStoreCategory category,
            PopupStoreStatus status
    ) {
        return new PopupStore(
                name,
                address,
                latitude,
                longitude,
                LocalDate.parse(startDate),
                LocalDate.parse(endDate),
                category,
                status,
                "실제 운영 정보가 아닌 Popup Store Map 개발 및 테스트용 샘플입니다.",
                null
        );
    }

    private static final PopupStoreCategory FASHION = PopupStoreCategory.FASHION;
    private static final PopupStoreCategory BEAUTY = PopupStoreCategory.BEAUTY;
    private static final PopupStoreCategory FOOD = PopupStoreCategory.FOOD;
    private static final PopupStoreCategory CHARACTER = PopupStoreCategory.CHARACTER;
    private static final PopupStoreCategory LIFESTYLE = PopupStoreCategory.LIFESTYLE;
    private static final PopupStoreCategory ETC = PopupStoreCategory.ETC;
    private static final PopupStoreStatus OPEN = PopupStoreStatus.OPEN;
    private static final PopupStoreStatus UPCOMING = PopupStoreStatus.UPCOMING;
    private static final PopupStoreStatus CLOSED = PopupStoreStatus.CLOSED;
}
