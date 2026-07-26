# Performance Baseline

Measurements below were captured in a local development environment and are not production SLA claims.

## Environment

- PostgreSQL 17.10
- 18 development popup stores
- local Spring Boot/frontend
- measured endpoints and bundle from the production-readiness pass

## HTTP and query baseline

| Target | Observed range / result | Payload or query note |
|---|---:|---|
| Popup list | 6.7–104.8 ms | 12,785 bytes |
| Popup detail | 3.6–10.5 ms | 705 bytes |
| Search | 4.8–19.1 ms | 5,064 bytes; local EXPLAIN execution 0.112 ms |
| Featured ranking | 7.8–21.7 ms | 2,838 bytes |
| Review list before batch verification | 4.5–31.6 ms | 4 SQL statements for 2 reviews |
| Review list after batch verification | 4.5–18.1 ms | 3 SQL statements for 2 reviews |

The review change removes one repeated verification query pattern in the measured case. The small sample and overlapping latency ranges are insufficient to claim a statistically significant response-time improvement.

## Frontend bundle

| Stage | JavaScript | Gzip |
|---|---:|---:|
| Baseline | 630.50 kB | 191.45 kB |
| After refactoring | 631.21 kB | 191.65 kB |
| Change | +0.71 kB | +0.20 kB |

The change is small, but the application remains a candidate for future route-level or feature-level splitting if a measured mobile loading problem emerges.

## Decisions based on evidence

- **Review visit verification:** batched because repeated queries were observed.
- **Featured ranking:** kept in application memory because only 18 candidates were measured and latency was acceptable.
- **Keyword search:** no `pg_trgm`/GIN index because the measured data and plan did not establish a bottleneck.
- **PostGIS geometry/GiST:** deferred because the current feature set does not execute DB radius/distance queries.
- **Redis:** not introduced; no demonstrated repeated-query bottleneck, stale-data budget or invalidation requirement.
- **Cursor pagination:** not introduced; current offset data volume did not justify contract complexity.

## Next measurement triggers

- Search or featured candidate volume grows by orders of magnitude.
- p95 endpoint latency is collected in a production-like environment.
- Query plans show sequential scans dominating realistic workloads.
- Mobile bundle/download/parse time becomes visible in RUM or lab measurements.
- Valhalla latency or route concurrency approaches service capacity.

Only then should indexes, projections, DB-side ranking, cache, spatial columns or code splitting be selected and documented with before/after evidence.
