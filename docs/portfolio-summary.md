# Portfolio Documentation Summary

## Problem

Popup events around Seongsu, Seoul Forest and Ttukseom are easy to discover individually but hard to combine into an efficient walking plan. The project connects discovery, member activity, route planning and GPS navigation in a single responsive web flow.

## Technical highlights

- Spring Boot feature modules with explicit Controller/Service/Repository boundaries
- JWT access token plus hashed, rotated refresh token cookie
- role-based popup management and owner/member data authorization
- Flyway-managed PostgreSQL schema with database constraints and JPA validation
- React/TypeScript feature hooks and a shared card/map selection model
- OpenLayers current-position/heading/follow/navigation layers
- Valhalla pedestrian routing, full polyline6 shape decoding and exact open-route optimization for at most eight destinations
- measured query/bundle baseline with deliberately deferred over-engineering

## Evidence index

- [System architecture](architecture/architecture.md)
- [Database ERD](erd/erd.md)
- [API specification](api/api-specification.md)
- [Feature flows](flow/feature-flows.md)
- [UI screenshots and inventory](ui/screen-inventory.md)
- [Figma-ready specification](ui/figma-spec.md)
- [Testing strategy](testing/testing.md)
- [Performance baseline](performance/performance.md)
- [Troubleshooting and optimization](troubleshooting-and-optimization.md)
- [Production-readiness notes](production-readiness.md)

## Honest scope

The repository provides a verified local development environment. It does not claim a public production deployment, AWS infrastructure, public live demo, real popup operations data or a published editable Figma file. Those are explicit future deliverables.
