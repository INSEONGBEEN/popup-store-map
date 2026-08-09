# Popup Store Map 포트폴리오 문서화 결과 보고서

- 작성일: 2026-07-26
- 작업 브랜치: `refactor/production-readiness`
- 기준 커밋: `b7b1edfb4cda97724c0a46365ed9f9c68311bed6`
- 커밋 메시지: `docs: add portfolio design artifacts and documentation`

## A. GitHub

### 변경 사항

- 루트 `README.md`를 취업용 포트폴리오 구조로 재작성
- `CHANGELOG.md`에 포트폴리오 문서화 내역 추가
- Architecture, ERD, API, UI, Flow, Testing, Performance 문서와 화면 캡처 생성
- 애플리케이션 코드는 변경하지 않음

### Git 결과

- Branch: `refactor/production-readiness`
- Commit: `b7b1edfb4cda97724c0a46365ed9f9c68311bed6`
- Push: `origin/refactor/production-readiness` 성공
- 로컬과 원격 커밋 해시 일치 확인
- `main` 브랜치에는 merge하지 않음

[GitHub 브랜치 README](https://github.com/INSEONGBEEN/popup-store-map/blob/refactor/production-readiness/README.md)

## B. Figma

| 항목 | 상태 |
|---|---|
| Figma 연결 | AVAILABLE |
| 기존 파일 읽기 | AVAILABLE |
| Seat | `View` |
| 새 파일/디자인 Write | AVAILABLE — 새 draft 생성·수정 검증 |
| 실제 Figma 파일 생성 | `Popup Store Map — Portfolio UI` |
| 실제 Figma URL | [Figma Design](https://www.figma.com/design/aPPGnSFCyHihzF53uTCaOT) |

연결 정보에는 `View` seat로 표시되지만 새 draft file 생성과 편집은 실제로 성공했다. Starter workspace의 3-page 제한에 맞춰 다음 구조로 구성했다.

- `01 Cover`
- `02 Design System`
- `03 Desktop`: 전체 앱 capture, Map & Route presentation, Mobile responsive frames

Design System에는 편집 가능한 색상, typography, button, chip, search input, popup card 요소를 배치했다. 실제 구현 화면은 다음 handoff 자료와 함께 Figma에 포함했다.

- [Figma UI 명세](ui/figma-spec.md)
- [화면 목록](ui/screen-inventory.md)
- [디자인 시스템](ui/design-system.md)
- [Desktop discovery](ui/assets/home-desktop.png)
- [Desktop map](ui/assets/map-desktop.png)
- [Mobile discovery](ui/assets/home-mobile.png)
- [Mobile login](ui/assets/login-mobile.png)

## C. System Architecture

### 생성한 파일

- [시스템 아키텍처 draw.io](architecture/system-architecture.drawio)
- [시스템 아키텍처 SVG](architecture/system-architecture.svg)
- [배포 아키텍처 draw.io](architecture/deployment-architecture.drawio)
- [배포 아키텍처 SVG](architecture/deployment-architecture.svg)
- [아키텍처 설명](architecture/architecture.md)

### 표현한 구성 요소

```text
User
→ React / Vite / OpenLayers
→ Spring Security
→ Feature Controller / Service
→ Spring Data JPA
→ PostgreSQL / PostGIS
```

보행 경로는 Backend가 Valhalla를 호출하고, 전체 polyline6 shape를 `[longitude, latitude]`로 변환해 Frontend에 전달한다. OpenLayers는 OSM 타일, 보행 경로, 팝업 마커와 현재 위치를 별도 Layer로 관리한다.

## D. Database ERD

### 생성한 파일

- [DBML](erd/schema.dbml)
- [ERD SVG](erd/erd.svg)
- [ERD 설명](erd/erd.md)

### 검증 결과

- Flyway migration을 Schema Source of Truth로 사용
- JPA Entity와 Flyway migration을 교차 확인
- 실제 존재하는 애플리케이션 테이블 10개만 반영
- PK, FK, UNIQUE, 주요 CHECK, Index와 관계 반영
- PostGIS extension은 설치되어 있지만 geometry/geography와 GiST index는 사용하지 않음을 명시

대상 테이블:

- `app_user`
- `refresh_token`
- `popup_store`
- `popup_engagement_event`
- `popup_engagement_summary`
- `popup_like`
- `popup_favorite`
- `visit_history`
- `popup_review`
- `popup_review_summary`

## E. Swagger 및 API Specification

[전체 API 명세](api/api-specification.md)

### API 그룹

- Authentication
- PopupStore CRUD, search, featured
- Engagement
- Favorite
- Visit
- Review
- Pedestrian route
- Route optimization

### 접근 정책

- PopupStore 조회와 검색: 공개
- PopupStore 생성·수정·삭제: `ADMIN`
- 즐겨찾기, 방문 기록, 내 리뷰: 인증 필요
- 리뷰 작성·수정·삭제: 인증과 방문 자격 또는 소유권 확인

개발 Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

Production profile에서는 Swagger/OpenAPI를 비활성화한다.

## F. Feature Implementation

### 인증

- 15분 Access JWT
- BCrypt 비밀번호 해시
- HttpOnly Refresh Token Cookie
- Refresh Token SHA-256 hash 저장
- Refresh Token Rotation과 기존 토큰 폐기
- Frontend single-flight refresh

### 팝업 탐색

- 키워드, 카테고리, 상태, 운영일 검색
- 페이징과 정렬
- 카드와 지도 마커 선택 상태 연동
- 조회, 좋아요, 일정 담기 기반 Featured Popup

### 개인 기능

- 즐겨찾기
- 방문 기록
- 마이페이지
- 방문 기록 기반 리뷰 작성 자격
- 리뷰 작성자 소유권 검사

### 보행 경로

- Valhalla `pedestrian` costing
- 전체 leg polyline6 shape 디코딩
- `[longitude, latitude]` 좌표 응답
- EPSG:4326 → EPSG:3857 변환
- 최대 8개 목적지 open-route 최적화
- 현재 위치, heading, follow mode, ETA와 maneuver 안내

[기능 Flow 문서](flow/feature-flows.md)

## G. Testing

| 검증 | 결과 |
|---|---|
| Backend `./gradlew test --rerun-tasks` | 65 passed, 0 failed, 0 skipped |
| Backend `./gradlew build` | 성공 |
| Frontend `npm test` | 51 passed, 0 failed |
| Frontend `npm run lint` | 성공 |
| Frontend `npm run build` | 성공 |
| Testcontainers/Flyway 통합 테스트 | 성공 |

주요 보호 규칙:

- Anonymous, USER, ADMIN 권한 구분
- Refresh Token Rotation
- 사용자 데이터 격리
- 즐겨찾기와 방문 기록 중복 방지
- 리뷰 작성 자격과 소유권
- Flyway migration
- 검색 조건
- 경로 요청 검증과 최적화
- polyline6 전체 경로 처리
- Frontend stale route 및 navigation 계산

Vite의 JavaScript chunk 크기 경고는 빌드 실패가 아니며 성능 문서에 기록했다.

[테스트 전략](testing/testing.md)

## H. Troubleshooting & Optimization

[전체 의사결정 기록](troubleshooting-and-optimization.md)

### 최종 선정 사례

1. Public Popup CUD API → Spring Security `ADMIN` 인가
2. `ddl-auto=update` → Flyway V1/V2 → `ddl-auto=validate`
3. 비대한 `PopupStoreService` → command/query/ranking 책임 분리
4. Review 방문 확인 반복 조회 → batch 조회
5. waypoint 직선 경로 → Valhalla 전체 polyline6 shape 처리

### 측정 결과

- 리뷰 2개 조회 기준 SQL: 4회 → 3회
- 변경 전 latency: 4.5–31.6ms
- 변경 후 latency: 4.5–18.1ms

측정 범위가 겹치고 데이터가 적어 통계적으로 유의미한 속도 향상이라고 표현하지 않았다.

Frontend bundle:

| 구분 | JavaScript | Gzip |
|---|---:|---:|
| Baseline | 630.50kB | 191.45kB |
| After | 631.21kB | 191.65kB |

[성능 Baseline](performance/performance.md)

## I. Deployment

### 현재 검증된 환경

- React/Vite `:5173`
- Spring Boot `:8080`
- PostgreSQL/PostGIS
- Docker Valhalla `:8002`
- Seoul BBBike OSM PBF
- Docker named volume

### 현재 배포 상태

- 로컬 개발 환경: 검증 완료
- Cloudflare 임시 터널: 모바일 개발 검증 용도
- 영구 Live Demo: 없음
- AWS 운영 배포: 미구현

현재 로컬 구조와 계획 중인 운영 구조는 [배포 아키텍처](architecture/deployment-architecture.svg)에서 구분했다.

## J. Notion

- 확인한 부모 페이지: `토이프로젝트`
- 업데이트한 페이지: `Popup Store Map`
- 페이지 URL: [Notion Popup Store Map](https://app.notion.com/p/3a6f22d4b4c8800dab53f784d4d63b23)
- 업데이트 후 페이지를 다시 조회해 저장 성공 확인

기존의 잘못된 OSRM, JavaScript, AWS EC2 배포 표기와 빈 문서 섹션을 현재 코드에 맞는 내용으로 교체했다. 후속 작업에서는 실제 화면 4장과 시스템 아키텍처, ERD, 인증·경로 흐름, 배포 아키텍처 이미지를 페이지에 직접 삽입하고 Figma 링크를 연결했다.

Notion 최종 구조:

1. 📖 Project Overview
2. 🎨 UI Design (Figma)
3. 🏗️ System Architecture
4. 🗄️ Database (ERD)
5. 🔌 API Specification (Swagger)
6. 💻 Feature Implementation
7. 🧪 Testing
8. 🚀 Deployment
9. 🐞 Troubleshooting & Optimization
10. 📝 Retrospective

## K. Consistency Check

다음 관계를 교차 검증했다.

```text
README
↔ Notion
↔ Actual Code
↔ Flyway
↔ Design Artifacts
```

검증 결과:

- SVG와 draw.io XML 문법 정상
- README 내부 링크 정상
- 신규 Secret, API Key, Token signature 없음
- `.env`, `node_modules`, `dist`, `build` 신규 Git 추적 없음
- 의도하지 않은 Application Code 변경 없음
- 실제 생성·검증한 Figma URL만 사용
- README와 Notion의 테스트 수치 및 기술 스택 일치

## L. Remaining Work

실제로 남아 있는 작업:

- Figma prototype interaction과 추가 상태별 component variant 확장
- AWS network/compute/database 설계와 배포
- Domain과 HTTPS
- CI/CD와 rollback 전략
- Backup/restore 검증
- Monitoring과 운영 알림
- Valhalla 용량 테스트
- OSM graph 갱신 정책
- Production browser/device/accessibility 검증

## Documentation Index

- [Portfolio Summary](portfolio-summary.md)
- [System Architecture](architecture/architecture.md)
- [Database ERD](erd/erd.md)
- [API Specification](api/api-specification.md)
- [Feature Flows](flow/feature-flows.md)
- [UI Screen Inventory](ui/screen-inventory.md)
- [Testing Strategy](testing/testing.md)
- [Performance Baseline](performance/performance.md)
- [Troubleshooting & Optimization](troubleshooting-and-optimization.md)
