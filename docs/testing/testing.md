# Testing Strategy

## Test pyramid in this repository

### Backend

- Unit tests cover route optimization, polyline6 decoding, request/response transformation and focused service rules.
- MVC/security tests verify public reads and role-protected popup writes.
- Service integration tests cover auth rotation, member-data isolation, favorites, visits, reviews and transaction-sensitive summaries.
- Flyway/JPA tests validate migration compatibility.
- Testcontainers is used where PostgreSQL-specific behavior provides value; H2 remains for faster focused tests where dialect differences are irrelevant.

### Frontend

- Pure TypeScript tests cover selection ordering, duplicate/limit rules, route coordinate construction, formatters and navigation calculations.
- API tests cover refresh coordination and backend route-response conversion.
- Map-focused tests verify full route coordinates are transformed rather than drawing selected waypoints as a fallback.
- Build and lint provide TypeScript/bundler/static-quality gates.

## Critical rules protected

| Rule | Verification intent |
|---|---|
| Public popup GET | anonymous request succeeds |
| Popup write authorization | anonymous blocked, USER receives 403, ADMIN succeeds |
| Refresh rotation | old refresh token is revoked and replacement is linked |
| Member data isolation | user cannot read or mutate another user's favorites/visits/reviews |
| Review eligibility | a qualifying visit is required |
| Review ownership | update/delete restricted to author |
| Duplicate prevention | favorite, daily visit and review uniqueness |
| Route validation | coordinate ranges and 2–8 destination constraints |
| Full route geometry | decoded leg shape, not waypoint straight-line fallback |
| Stale route | selection/origin/order changes invalidate displayed route |

## Required regression commands

```bash
cd backend
./gradlew test
./gradlew build

cd ../frontend
npm test
npm run lint
npm run build
```

## Browser smoke scope

- Discovery home loads development seed data.
- Search/filter and map show the same popup set.
- Desktop and 390px mobile layouts render without blocking overflow.
- Account menu and login sheet are keyboard-addressable.
- Map controls and marker selector expose accessible names.

Browser geolocation, live Valhalla routing, permission denial, account mutation and navigation require their respective services/permissions and are not implied by a static screenshot pass.

## What test count does not prove

A passing count only proves that the encoded assertions passed in one environment. It does not replace:

- production-like load/concurrency measurement
- disaster recovery and migration rollback drills
- browser/device matrix testing
- external Valhalla/OSM availability testing
- penetration testing

## Verified checkpoint · 2026-07-26

| Check | Result |
|---|---|
| Backend `./gradlew test --rerun-tasks` | 65 passed, 0 failed, 0 skipped |
| Backend `./gradlew build` | passed |
| Frontend `npm test` | 51 passed, 0 failed |
| Frontend `npm run lint` | passed |
| Frontend `npm run build` | passed |

Vite reported the existing JavaScript chunk-size warning (631.21 kB, gzip 191.65 kB). It is documented as a measurement and did not fail the build.
