# API Specification

Base path: `/api`
Interactive documentation in the `dev` profile: `http://localhost:8080/swagger-ui/index.html`

Production configuration disables Swagger/OpenAPI exposure. This document summarizes the source-controlled HTTP contract; Controller annotations remain authoritative.

## Authentication model

- Access token: Bearer JWT returned in the response body, kept in frontend memory.
- Refresh token: random opaque value in an HttpOnly cookie; only its SHA-256 hash is stored.
- Roles: `USER`, `ADMIN`.
- Public catalog reads remain anonymous.
- Popup create/update/delete requires `ADMIN`.
- Favorites, visits, my reviews, review writes and `/auth/me` require authentication.

## Auth

| Method | Path | Auth | Purpose | Success |
|---|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register member | 201 |
| POST | `/api/auth/login` | Public | Authenticate and issue access/refresh tokens | 200 |
| POST | `/api/auth/refresh` | Refresh cookie + origin check | Rotate refresh token and issue access token | 200 |
| POST | `/api/auth/logout` | Refresh cookie | Revoke refresh token and clear cookie | 204 |
| GET | `/api/auth/me` | Bearer | Current member profile | 200 |

Signup:

```json
{
  "email": "user@example.com",
  "password": "at-least-8-characters",
  "nickname": "성수산책자"
}
```

Authentication response:

```json
{
  "accessToken": "<redacted>",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "성수산책자",
    "role": "USER"
  }
}
```

## Popup catalog

| Method | Path | Auth | Purpose | Success |
|---|---|---|---|---|
| GET | `/api/popup-stores` | Public | Full list | 200 |
| GET | `/api/popup-stores/{id}` | Public | Detail with engagement/review/personalization | 200 |
| GET | `/api/popup-stores/search` | Public | Optional filters, paging and sorting | 200 |
| GET | `/api/popup-stores/featured` | Public | Engagement-ranked current/upcoming popups | 200 |
| POST | `/api/popup-stores` | ADMIN | Create popup | 201 |
| PUT | `/api/popup-stores/{id}` | ADMIN | Replace editable popup fields | 200 |
| DELETE | `/api/popup-stores/{id}` | ADMIN | Delete popup | 204 |

Search query parameters:

| Name | Type | Meaning |
|---|---|---|
| `keyword` | string | case-insensitive substring of name |
| `category` | enum | `FASHION`, `BEAUTY`, `FOOD`, `CHARACTER`, `LIFESTYLE`, `ETC` |
| `status` | enum | `UPCOMING`, `OPEN`, `CLOSED` |
| `operatingDate` | ISO date | inclusive `startDate <= date <= endDate` |
| `page` | integer | zero-based, default 0 |
| `size` | integer | default 10, server-capped |
| `sort` | string | Spring sort expression; default createdAt descending |

Page response:

```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true
}
```

Popup create/update body:

```json
{
  "name": "개발용 팝업",
  "address": "서울특별시 성동구 ...",
  "latitude": 37.5445,
  "longitude": 127.056,
  "startDate": "2026-07-26",
  "endDate": "2026-08-02",
  "category": "LIFESTYLE",
  "status": "OPEN",
  "description": "개발 환경 예시",
  "imageUrl": null
}
```

## Engagement

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/popup-stores/{popupStoreId}/engagement/view` | Public | de-duplicated detail view |
| POST | `/api/popup-stores/{popupStoreId}/engagement/plan-add` | Public | de-duplicated schedule add |
| PUT | `/api/popup-stores/{popupStoreId}/engagement/like` | Public/member | add anonymous or member like |
| DELETE | `/api/popup-stores/{popupStoreId}/engagement/like` | Public/member | remove like |

Anonymous requests supply bounded visitor/session identifiers. On login, anonymous likes can be merged into the member account without exposing another user's data.

## Favorites and visits

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/users/me/favorites/{popupId}` | Bearer | Save favorite |
| DELETE | `/api/users/me/favorites/{popupId}` | Bearer | Remove favorite |
| GET | `/api/users/me/favorites` | Bearer | Current member favorites |
| POST | `/api/users/me/visits/{popupId}` | Bearer | Record arrival/manual visit |
| GET | `/api/users/me/visits` | Bearer | Current member visit history |

Visit body:

```json
{
  "source": "MANUAL_CONFIRMATION",
  "visitedAt": "2026-07-26T15:20:00",
  "routeSessionId": null
}
```

Valid sources are `NAVIGATION_ARRIVAL` and `MANUAL_CONFIRMATION`.

## Reviews

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/popup-stores/{popupId}/reviews` | Public | Popup reviews |
| POST | `/api/popup-stores/{popupId}/reviews` | Bearer | Create review after a visit |
| PATCH | `/api/popup-stores/{popupId}/reviews/{reviewId}` | Bearer/owner | Update own review |
| DELETE | `/api/popup-stores/{popupId}/reviews/{reviewId}` | Bearer/owner | Delete own review |
| GET | `/api/users/me/reviews` | Bearer | Current member reviews |

```json
{
  "rating": 5,
  "content": "직접 방문한 뒤 남기는 열 자 이상의 후기입니다."
}
```

Business rules: a visit is required, one review per member/popup, rating 1–5, content 10–1000 characters, update/delete by owner only.

## Pedestrian routing

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/routes/pedestrian` | Public | Valhalla route in supplied order |
| POST | `/api/routes/pedestrian/optimize` | Public | Optimize an open route for 2–8 destinations, then route |

Ordered route request:

```json
{
  "locations": [
    { "longitude": 127.0569, "latitude": 37.5446 },
    { "longitude": 127.0582, "latitude": 37.5429 }
  ]
}
```

Route response contains:

- decoded full route `coordinates` as `{longitude, latitude}`
- `distanceMeters` and `durationSeconds`
- per-leg distance/duration
- reduced maneuver data: instruction, type, distance, time, street names and shape indices

Optimization request keeps the origin separate from selected popup ids. The server requests a Valhalla pedestrian matrix, applies exact Held–Karp dynamic programming for a maximum of eight destinations, and returns original/ordered ids, route, metrics and calculated savings. It does not solve a closed tour.

## Error contract

```json
{
  "code": "POPUP_NOT_FOUND",
  "message": "팝업스토어를 찾을 수 없습니다."
}
```

Validation, authentication, authorization, missing resources, route unavailability, timeout and malformed upstream responses are mapped to user-safe codes/messages. Stack traces, SQL, secret values, internal Valhalla URLs and raw upstream errors are not part of the public contract.

Common status meanings:

- `400`: malformed or invalid input
- `401`: missing/expired authentication
- `403`: insufficient role or object ownership
- `404`: target resource not found
- `409`: duplicate/conflicting business state
- `502`: routing upstream returned no usable route/malformed response
- `504`: routing timeout
