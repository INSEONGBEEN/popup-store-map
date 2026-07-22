# Changelog

## Unreleased

### Added

- 이메일 회원가입·로그인, 메모리 Access Token, 회전형 HttpOnly Refresh Token 기반 인증
- 새로고침 인증 복원, 401 single-flight 갱신 및 접근 가능한 로그인·회원가입 Modal
- 팝업 발견·지도·오늘 일정을 한 화면에서 연결하는 통합 홈과 검색·카테고리 탐색 UI
- 홈 상세 Overlay, 지도 상세 Drawer 및 공통 PopupStore 상세 콘텐츠
- 익명 세션 기반 조회수·좋아요·일정 추가 지표와 최근 참여 기반 featured 팝업 API
- 현재 위치 Accuracy Circle, Heading Cone·Triangle 및 GPS follow/heading-follow UI
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
- Valhalla 보행시간 행렬과 정확 Held-Karp 알고리즘 기반 최적 방문 순서 API
- 원래 순서와 추천 순서의 거리·시간 비교 및 추천 순서 적용 UI
- watchPosition 기반 실시간 위치 추적, follow/free-pan 및 추적 종료 기능
- 상세 경로 투영, 남은 거리·시간, maneuver 안내와 경로 이탈 자동 재탐색 MVP
- 같은 Wi-Fi 모바일 접속을 위한 Vite LAN listen과 same-origin API proxy
- 실제 모바일 GPS 확인을 위한 cloudflared 임시 HTTPS 터널 문서

### Changed

- 일정 추가와 경로 생성을 분리하고 `길안내 시작` 시점에만 최적화·상세 경로를 요청하도록 개선
- Mac Wi-Fi 위치 fallback, 단일 watcher, 최근 위치 재사용 및 모바일 절대 방향 보정 강화
- 모바일 safe-area, Header, 카드, Modal, Drawer, 일정 Dock 및 GPS FAB 반응형 레이아웃 개선
- PopupStore에 category와 status 필드 추가
- 테스트 환경을 인메모리 H2로 격리
- backend/frontend 실행 및 개발 데이터 사용법을 README에 문서화
- 공개 OSRM 자동차 경로를 로컬 Valhalla 보행 경로로 교체
- API 응답의 전체 보행 경로 좌표가 지도에 표시되도록 경로 데이터 병합 수정
- Valhalla maneuver shape index를 multi-leg 전체 경로 인덱스로 변환
- Frontend API 호출을 localhost 절대주소에서 `/api` 상대경로로 변경
