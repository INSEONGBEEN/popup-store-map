# Troubleshooting & Optimization

These cases are reconstructed from the current implementation, tests, migration history and measured production-readiness notes.

## Case 1 — Public popup writes

**Problem**
Popup create/update/delete endpoints were reachable without an administrative boundary.

**Cause**
CRUD functionality preceded member roles and the initial security request matcher treated popup routes too broadly.

**Options**

- manual role checks inside every controller
- separate admin URL tree
- centralized Spring Security request authorization

**Decision**
Keep the existing API contract and protect `POST`, `PUT` and `DELETE` with `ADMIN` authorization in Spring Security.

**Implementation**
Public GET remains unchanged. Security integration tests encode anonymous → blocked, USER → 403, ADMIN → success.

**Result**
The authorization rule is centralized and existing frontend/read contracts remain stable.

## Case 2 — Implicit schema updates

**Problem**
`ddl-auto=update` made schema state depend on application startup and obscured review/auth/engagement constraints.

**Cause**
The prototype began with JPA-driven table creation and later accumulated dependent member features.

**Options**

- keep automatic updates
- replace the database from a fresh schema
- migrate existing development schema with versioned SQL

**Decision**
Introduce Flyway V1/V2 and set JPA to `ddl-auto=validate`.

**Implementation**
V1 describes the full PostgreSQL schema. V2 conditionally aligns previously created development tables, including legacy description type and missing constraints, without blindly deleting data.

**Result**
Schema changes are reviewable and repeatable; JPA now detects mismatches instead of mutating schema.

## Case 3 — Popup service responsibility

**Problem**
CRUD, search, detail composition and ranking changed for different reasons but were concentrated in one service.

**Cause**
Capabilities were added incrementally to the original CRUD service.

**Options**

- keep one class
- introduce a large generic service framework
- separate command, query and ranking responsibilities behind the existing facade

**Decision**
Use focused services while keeping the facade contract where compatibility helps.

**Implementation**
`PopupStoreCommandService`, `PopupStoreQueryService` and `PopupStoreRankingService` own distinct transaction/read responsibilities. The repository remains persistence-focused.

**Result**
Responsibilities and tests are easier to locate without a package rewrite or API break.

## Case 4 — Review verified-visit queries

**Problem**
Verified-visit status could issue a repeated lookup while mapping a review list.

**Cause**
Each review response independently asked whether its member had visited the popup.

**Options**

- leave the pattern at small scale
- eager-load broad relationships
- batch the required visit keys

**Decision**
Fetch the relevant visit keys once and map verification in memory for the page.

**Implementation**
The measured two-review request changed from four SQL statements to three.

**Result**
The repeated query pattern was removed. Local latency changed from 4.5–31.6 ms to 4.5–18.1 ms, but the ranges overlap and sample size is small; no statistically significant speedup is claimed.

## Case 5 — Straight-line pedestrian route

**Problem**
The map connected origin and popup waypoints with diagonal segments instead of streets and footpaths.

**Cause**
Valhalla returns each leg shape as encoded polyline6; waypoint coordinates were mistakenly sufficient to produce a visually plausible `LineString`.

**Options**

- keep a waypoint fallback
- decode only endpoints
- decode and merge every leg shape, rejecting malformed success responses

**Decision**
Use only the full decoded Valhalla shape after a successful route call.

**Implementation**
The backend decodes signed deltas at precision `1e6`, converts latitude/longitude to response longitude/latitude, removes only duplicate leg boundaries and returns 502 for empty/invalid shapes. The frontend creates the `LineString` only from `route.coordinates`.

**Result**
The rendered route follows the pedestrian network. Backend/frontend regression tests prevent reintroducing a straight waypoint fallback.

## Deferred optimizations

- Redis: no measured cache-worthy bottleneck or invalidation budget
- `pg_trgm` + GIN: local substring search is not a demonstrated bottleneck
- PostGIS geometry/GiST: no current DB radius/distance query
- DB-side featured ranking: bounded 18-row development candidate set is currently acceptable
- code splitting: measure mobile loading/parse cost before changing chunk boundaries
