# Production Readiness Refactoring

## 목적과 기준선

이 문서는 prototype의 사용자 기능과 API contract를 유지하면서 보안, schema 관리, 응집도, 테스트,
측정 기반 성능 개선을 수행한 근거를 기록한다. 시작점은 `feat/member-features`
`ae9f0e6f8a1165af306c8266a9a8fd5e47daaed3`이다.

기준선:

| 항목 | 결과 |
|---|---:|
| Backend tests | 56 passed |
| Frontend tests | 51 passed |
| Backend build | passed |
| Frontend lint/build | passed |
| Vite production JS | 630.50 kB, gzip 191.45 kB |
| 개발 DB PopupStore | 18 rows |

## Phase checkpoint

1. Baseline: 양쪽 테스트·build·lint와 Git 시작점을 확정했다.
2. Authorization: 공개 GET은 유지하고 PopupStore POST/PUT/DELETE를 ADMIN으로 제한했다. JWT `role`
   claim을 `ROLE_*` authority로 변환하고 익명/USER/ADMIN matrix를 통합 테스트했다.
3. Database migration: Spring Boot 4 Flyway starter와 V1/V2 migration을 도입했다. 기존 DB는
   `/tmp/popup_store_pre_flyway_20260726.dump`로 백업한 후 V1 baseline과 V2를 적용했다.
4. Integrity: name NOT NULL, description text 변환, 좌표·날짜·리뷰·요약 CHECK와 누락 FK를 보강했다.
   18개 popup과 18개 description이 보존됐다.
5. Backend architecture: 기존 `PopupStoreService` facade contract는 유지하고 transaction boundary를
   command/query/ranking service로 분리했다.
6. Validation: PopupStore 요청의 DB 길이, 위·경도 범위, 운영 날짜 순서를 Bean Validation으로 보호했다.
7. Error contract: 기존 `status`와 `message`에 machine-readable `code`를 추가했다. 예상하지 못한
   예외 상세는 로그에만 남기고 외부에는 고정 메시지를 반환한다.
8. Security hardening: origin allow-list CORS, production Secure cookie/HTTPS origin 검증, production
   Swagger 비활성화와 framework error detail 차단을 적용했다.
9. Frontend: 전역 상태 라이브러리 없이 theme, transient toast timer, popup detail selection을
   독립 hook으로 이동했다. 지도·경로 orchestration은 함께 변경되는 책임이라 App에 유지했다.
10. Test architecture: PostgreSQL 17/PostGIS Testcontainers로 Flyway, Hibernate validate, DB CHECK를
    검증하고 Security integration test를 추가했다.
11. Performance baseline: 개발 DB와 로컬 API에서 response time, payload, EXPLAIN, Hibernate query
    count를 측정했다.
12. JPA optimization: 재현된 review verified N+1만 batch query로 변경했다.
13. Spatial/application: 현재 데이터와 API 요구에서는 PostGIS geometry, Redis, DB ranking 재작성이
    실익이 없어 도입하지 않았다.

최종 회귀 결과는 Backend 65개, Frontend 51개 테스트 통과다. 브라우저 스모크 테스트에서는 dev
샘플 18건, 현재 운영 5건, 지도 탐색 화면을 확인했고 console warning/error는 없었다.

## Security improvements

- PopupStore write API: anonymous `401`, USER `403`, ADMIN success.
- Refresh cookie: HttpOnly, SameSite=Lax, prod Secure.
- Access token: 15분, Refresh token: 10일, DB에는 hash만 저장.
- Refresh rotation과 이전 토큰 거부 테스트 유지.
- CORS는 `AUTH_ALLOWED_ORIGINS`만 허용하며 wildcard를 사용하지 않는다.
- production은 localhost/HTTP origin을 거부하고 Swagger를 노출하지 않는다.
- API 오류에 stack trace, SQL, 내부 URL, secret을 포함하지 않는다.

Deferred:

- token-family 전체 폐기 기반 reuse detection
- API Gateway/WAF 또는 분산 rate limit
- 이메일 검증, 비밀번호 재설정, 계정 삭제 정책
- production secret manager와 key rotation runbook

## Database migration strategy

```text
Flyway V1/V2 -> PostgreSQL schema <- Hibernate ddl-auto=validate
```

- 빈 DB: V1과 V2를 순서대로 적용한다.
- 기존 dev DB: dev profile의 baseline-on-migrate로 V1 marker를 만든 뒤 V2를 적용한다.
- production: 자동 baseline을 사용하지 않고 backup, orphan/invalid row 검사, 수동 승인 후 실행한다.
- H2는 빠른 service test에만 사용한다. PostgreSQL 고유 SQL과 constraint는 Testcontainers로 검증한다.
- 과거 `member-schema-postgresql.sql`은 실행 대상이 아니다.

## Performance baseline and result

측정 환경은 macOS 로컬 개발환경, PostgreSQL 17.10, 18개 PopupStore다. 운영 SLA로 해석하지 않는다.
HTTP 값은 첫 호출을 포함한 5회 범위이며 payload는 JSON byte다.

| Target | Before | After | Change | Reason |
|---|---:|---:|---:|---|
| popup list | 6.7–104.8ms / 12,785B | 동일 기능 | no optimization | 18행에서 병목 아님 |
| popup detail | 3.6–10.5ms / 705B | 동일 기능 | no optimization | 병목 아님 |
| encoded keyword search | 4.8–19.1ms / 5,064B | 동일 기능 | no index | EXPLAIN 0.112ms |
| featured 4 | 7.8–21.7ms / 2,838B | 동일 기능 | no DB rewrite | 후보 18건 |
| review list, 2 reviews | 4 statements | 3 statements | -1 and O(1) verified lookup | N+1 재현 |
| review list HTTP | 4.5–31.6ms / 560B | 4.5–18.1ms / 560B | 유의미하다고 단정하지 않음 | 로컬 표본이 작음 |
| Vite JS | 630.50kB gzip 191.45kB | 631.21kB gzip 191.65kB | +0.71kB | 3개 lifecycle hook |

검색 실행계획은 18행 sequential scan, planning 0.185ms, execution 0.112ms였다. `%keyword%` 검색이
실제 운영 데이터에서 병목이 되는 경우에만 pg_trgm/GIN을 다시 측정한다.

## Architecture after

```text
PopupStoreController
  -> PopupStoreService (stable facade)
       -> PopupStoreCommandService (write transaction)
       -> PopupStoreQueryService (read/personalization)
       -> PopupStoreRankingService (featured policy)
```

Frontend는 기존 `api/components/features/map/types` 구조를 유지한다. `App`은 화면 간 orchestration,
지도와 navigation 상태 연결을 담당하고 독립 수명주기는 feature hook이 관리한다.

## Deferred improvements

- PostGIS: 반경/거리순 API 요구와 운영 데이터가 생긴 뒤 Point(SRID 4326), GiST, migration을 설계한다.
- Redis: 반복 부하, DB 병목, stale 허용범위, invalidation 정책이 없으므로 현재는 불필요하다.
- Frontend chunk: OpenLayers 지도가 첫 화면 핵심이라 무조건 lazy loading하지 않았다. 실제 Web
  Vitals와 초기 지도 사용률 측정 후 route/code splitting을 결정한다.
- Ranking: 18개 후보의 in-memory 정렬은 현재 병목이 아니다. 후보 증가와 SQL 측정 후 aggregation
  projection으로 이동한다.

## AWS 배포 전 남은 작업

- RDS migration backup/restore rehearsal과 least-privilege DB user
- Secrets Manager 또는 Parameter Store 기반 secret 주입 및 rotation
- HTTPS domain, production CORS origin, Secure cookie 검증
- ALB/API Gateway/WAF rate limit과 access log 보존 정책
- Valhalla CPU/메모리/volume, OSM update 운영 계획
- CI에서 Docker/Testcontainers 실행 환경 확보
- observability, health check, alert, log redaction 검증
- 관리자 UI와 관리자 계정 발급/회수 절차
