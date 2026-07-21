# Changelog

## Unreleased

### Added

- PopupStore keyword, category, status, operating date 검색과 페이징·정렬 API
- Swagger/OpenAPI 기반 CRUD 및 검색 API 문서
- dev 프로필 전용 성수동 개발 샘플 데이터 18건과 localhost CORS 설정
- Vite, React, TypeScript, OpenLayers, Axios 기반 지도 프론트엔드
- OSM 지도 마커, 선택 강조, 키보드 선택 및 상세정보 패널
- 검색, 잘못된 요청값, dev seed 중복 방지 테스트
- Valhalla 보행 경로 Backend 프록시와 polyline6 상세 경로 변환
- 성수역·현재 위치·첫 선택 팝업 출발지와 브라우저 Geolocation 지도 표시
- 서울 OSM 그래프를 생성·재사용하는 Valhalla Docker Compose 개발 환경
- 경로 API, 출발지, 위치 오류, 상세 LineString 변환 회귀 테스트

### Changed

- PopupStore에 category와 status 필드 추가
- 테스트 환경을 인메모리 H2로 격리
- backend/frontend 실행 및 개발 데이터 사용법을 README에 문서화
- 공개 OSRM 자동차 경로를 로컬 Valhalla 보행 경로로 교체
- API 응답의 전체 보행 경로 좌표가 지도에 표시되도록 경로 데이터 병합 수정
