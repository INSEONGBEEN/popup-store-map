# Popup Store Map

성수역, 서울숲역, 뚝섬역 주변의 팝업스토어를 OpenStreetMap 지도에서 확인하는 서비스입니다.
현재는 팝업스토어 CRUD·검색 API, 통합 탐색 홈, 지도 마커·상세정보, 익명 참여 지표,
최적 순서 기반 도보 경로, 실시간 GPS 안내와 기본 회원 인증이 구현되어 있습니다.

> `[DEV]`로 시작하는 샘플은 실제 운영 정보가 아닌 개발·테스트용 가상 데이터입니다.
> 주소와 좌표 역시 UI 및 검색 기능 검증을 위한 성수동 일대의 개발용 위치입니다.

## 프로젝트 구조

```text
popup-store-map/
├── backend/   # Java 21, Spring Boot, PostgreSQL/PostGIS
└── frontend/  # Vite, React, TypeScript, OpenLayers, Axios
```

## Backend 실행

PostgreSQL의 `popup_store` 데이터베이스와 PostGIS 확장을 준비한 뒤 실행합니다.
데이터베이스 접속 정보는 로컬 환경에 맞게 별도로 관리하고 저장소에 비밀번호를 커밋하지 마세요.

JWT 서명 키는 환경변수로만 제공합니다. 32바이트 이상의 임의 값을 사용하고 저장소에 실제 값을
커밋하지 마세요. 로컬 실행용 변수 목록은 `backend/.env.example`에 placeholder로만 제공합니다.

```bash
cd backend
JWT_SECRET='<로컬에서 생성한 32바이트 이상의 값>' ./gradlew bootRun
```

Swagger UI: <http://localhost:8080/swagger-ui/index.html>

### 개발 샘플 데이터와 dev 프로필

```bash
cd backend
JWT_SECRET='<로컬에서 생성한 32바이트 이상의 값>' ./gradlew bootRun --args='--spring.profiles.active=dev'
```

`dev` 프로필에서만 `PopupStoreDevDataInitializer`가 실행됩니다. 18개의 `[DEV]` 샘플을
Repository로 저장하며, 재시작할 때 각 샘플 이름이 이미 존재하는지 확인해 중복 삽입을 방지합니다.
일반 프로필과 운영 환경에서는 initializer와 개발용 CORS 설정이 활성화되지 않습니다.

### 회원 인증

- Access Token은 15분 동안 유효하며 Frontend 메모리에만 보관합니다.
- Refresh Token은 10일 동안 유효하며 `HttpOnly`, `SameSite=Lax` Cookie로 전달되고 DB에는
  SHA-256 hash만 저장됩니다. 갱신 시 기존 토큰을 폐기하고 새 토큰으로 회전합니다.
- localhost에서는 `AUTH_COOKIE_SECURE=false`, HTTPS 운영 환경에서는
  `AUTH_COOKIE_SECURE=true`를 지정합니다.
- Cookie를 사용하는 refresh/logout 요청은 Origin이 전달된 경우 `AUTH_ALLOWED_ORIGINS` 목록으로
  검사합니다. 모든 origin 허용은 사용하지 않습니다.

로그인 사용자는 카드와 상세의 Bookmark 버튼으로 개인 즐겨찾기를 관리할 수 있습니다. Heart는
공개 좋아요 지표이고 Bookmark는 다른 사용자에게 공개되거나 featured 점수에 반영되지 않는 개인
저장입니다. 비로그인 상태에서 Bookmark를 누르면 로그인 창이 열리고, 로그인 성공 후 원래 팝업을
자동으로 저장합니다. 헤더의 마이페이지에서 최근 저장순 목록을 열어 상세 보기, 해제, 오늘 일정
추가를 할 수 있습니다.

```text
POST   /api/users/me/favorites/{popupId}
DELETE /api/users/me/favorites/{popupId}
GET    /api/users/me/favorites?page=0&size=10&sort=createdAt,desc
```

방문 기록은 로그인 사용자가 길안내 중 실제 목적지 도착 판정을 받거나, 상세 화면에서 확인 후
`방문 완료 기록`을 누른 경우에만 생성됩니다. 같은 사용자·팝업·날짜는 한 건으로 유지하고 다른
날짜의 재방문은 허용합니다. GPS 좌표, 위치 이력, 전체 이동 경로와 heading은 저장하지 않습니다.
방문 기록 저장 실패는 진행 중인 길안내를 중단시키지 않습니다.

```text
POST /api/users/me/visits/{popupId}
GET  /api/users/me/visits?page=0&size=10&from=2026-07-01&to=2026-07-31&sort=visitedAt,desc
```

현재 방문 기록 삭제 기능은 제공하지 않습니다.

리뷰는 로그인한 사용자가 해당 팝업의 방문 기록을 가진 경우에만 한 건 작성할 수 있습니다. 평점은
1~5점, 내용은 10~1000자이며 본인의 리뷰만 수정·삭제할 수 있습니다. 길안내 도착으로 생성된 방문
기록이 있으면 `길안내 방문 확인` Badge가 표시됩니다. 공개 리뷰 응답은 닉네임만 제공하고 이메일,
내부 사용자 ID와 방문 기록 ID는 노출하지 않습니다. 평균과 리뷰 수는 리뷰 변경 트랜잭션에서 별도
summary로 함께 갱신되어 팝업 카드마다 추가 집계 요청을 만들지 않습니다.

```text
GET    /api/popup-stores/{popupId}/reviews?sort=latest&page=0&size=10
POST   /api/popup-stores/{popupId}/reviews
PATCH  /api/popup-stores/{popupId}/reviews/{reviewId}
DELETE /api/popup-stores/{popupId}/reviews/{reviewId}
GET    /api/users/me/reviews
```

## Frontend 실행

Node.js와 npm이 필요합니다.

```bash
cd frontend
npm install
npm run dev
```

Vite는 `0.0.0.0:5173`에서 수신하며 실행 로그에 다음 두 주소를 표시합니다.

```text
Local:   http://localhost:5173/
Network: http://<개발 PC의 LAN IP>:5173/
```

같은 Wi-Fi에 연결된 휴대폰에서는 `Network` 주소를 엽니다. macOS 방화벽이 연결을 묻는다면
Node.js의 로컬 네트워크 수신을 허용해야 합니다. 공유기의 AP/client isolation이 켜져 있으면 같은
Wi-Fi여도 기기 간 접속이 차단될 수 있습니다.

Frontend API는 `localhost` 절대주소를 사용하지 않고 현재 origin의 `/api`를 호출합니다. Vite가
`/api` 요청을 개발 PC의 `http://127.0.0.1:8080`으로 proxy하므로 휴대폰에서도 동일하게
동작합니다. 브라우저와 Backend가 직접 교차 origin으로 통신하지 않아 LAN IP를 Spring CORS에
추가하거나 모든 origin을 허용할 필요가 없습니다. 기존 dev CORS는 localhost 두 주소만 허용합니다.

확인 순서:

1. Backend를 8080 포트에서 실행합니다.
2. `npm run dev` 로그의 Network URL을 휴대폰에서 엽니다.
3. 팝업스토어 18개와 지도 마커가 표시되는지 확인합니다.
4. 개발 PC에서 `http://<LAN IP>:5173/api/popup-stores/search?page=0&size=1`도 호출해 proxy를 확인할 수 있습니다.

### 휴대폰 GPS 확인용 HTTPS 터널

브라우저 Geolocation API는 `localhost` 또는 HTTPS secure context에서만 허용됩니다. LAN의
`http://<LAN IP>:5173`에서는 화면과 API를 확인할 수 있지만 실제 GPS 권한 요청은 제한될 수
있습니다. 개발용 실제 GPS 검증에는 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)의 임시 HTTPS 터널을 사용할 수 있습니다.

```bash
brew install cloudflared

# 터미널 1: Backend
cd backend
JWT_SECRET='<로컬에서 생성한 32바이트 이상의 값>' ./gradlew bootRun --args='--spring.profiles.active=dev'

# 터미널 2: Vite (0.0.0.0:5173 + /api proxy)
cd frontend
npm run dev

# 터미널 3
cloudflared tunnel --url http://127.0.0.1:5173
```

cloudflared가 출력한 `https://<generated-subdomain>.trycloudflare.com` 주소를 휴대폰에서 엽니다. 이 HTTPS origin의
`/api`도 Vite proxy를 통해 로컬 Backend로 전달됩니다. Quick Tunnel URL은 인터넷에 공개되므로
개발용 샘플 데이터에만 사용하고, 비밀번호·API Key·개인정보를 입력하지 말며 검증 후 프로세스를
종료하세요. 운영 배포 수단으로 사용하지 않습니다. Quick Tunnel을 다시 실행해 주소가 바뀌면
브라우저에는 새로운 origin으로 인식되므로 위치 권한을 다시 허용해야 할 수 있습니다.

## 통합 홈 사용자 흐름

화면은 별도의 발견·지도·루트 페이지로 나뉘지 않습니다. 한 홈에서 다음 순서로 이용합니다.

1. 고정 헤더의 통합 검색 또는 카테고리 Chip으로 팝업을 찾습니다.
2. 홈의 추천·운영 중·오픈 예정 카드 본문을 누르면 현재 스크롤 위치 위에 상세 Modal이 열립니다.
   지도 검색 결과 카드와 지도 Marker는 지도 안의 Detail Drawer를 사용합니다.
3. 카드의 `+ 일정` 또는 상세의 `오늘 일정에 추가`를 눌러 방문지를 담습니다.
4. 하단 `오늘 일정` Dock을 펼쳐 순서와 출발지를 조정합니다. 이 단계에서는 경로 API를 호출하지 않습니다.
5. `길안내 시작`을 누르면 그 시점에 Valhalla 기반 최적 방문 순서와 상세 도보 경로를 계산합니다.
6. GPS 위치가 준비되어 있으면 Navigation Mode로 전환하고, 없으면 계산된 경로와 거리·시간을 먼저 표시합니다.

카드 본문 클릭은 상세 확인만 수행하며 오늘 일정에 자동 추가되지 않습니다. 카드와 지도 마커는
`useRoutePlanner`의 동일한 선택 배열을 사용하므로 한쪽의 추가·삭제·순서 변경이 다른 쪽에도 즉시
반영됩니다. 팝업 카테고리는 현재 Backend enum인 패션, 뷰티, 음식, 캐릭터, 라이프스타일, 기타만
표시하며 존재하지 않는 게임·전시 enum 값을 임의로 만들지 않습니다.

홈 상세 Modal은 배경 스크롤을 잠그며 ESC, 바깥 영역, 닫기 버튼으로 닫을 수 있습니다. Modal의
`지도에서 위치 보기`를 눌렀을 때만 지도 섹션으로 이동하고 해당 Marker를 중심에 둔 뒤 Map Drawer로
전환합니다. Mobile에서는 같은 상세 내용을 safe area를 고려한 Bottom Sheet로 표시합니다. 두 표시
방식은 하나의 `PopupStoreDetailsContent`를 공유하므로 좋아요와 오늘 일정 상태도 동일하게 유지됩니다.

### 경로 계산과 실제 길안내

- 일정 추가·제거·드래그 정렬·출발지 변경은 선택 상태만 바꾸고 진행 중인 요청과 이전 경로를 무효화합니다.
- Valhalla 최적화와 상세 경로 API는 `길안내 시작` 버튼을 누른 시점에만 호출합니다.
- `성수역` 또는 `첫 팝업` 출발은 GPS 권한과 독립적으로 최적 순서, 경로선, 거리와 시간을 제공합니다.
- `현재 위치` 출발은 최초 좌표 확보에 실패하면 경로 요청을 보내지 않고 출발지 변경을 안내합니다.
- 수동 출발지 경로가 성공했지만 GPS가 없다면 “실시간 위치 없이 경로를 표시합니다”라고 안내하며,
  사용자가 GPS를 다시 시도할 수 있습니다.
- 실제 GPS Navigation은 버튼을 누른 시점의 최신 상세 보행 경로와 지속 `watchPosition`을 사용합니다.
- 길안내 중에는 홈 카드와 큰 일정 패널을 숨기고 지도, 상단 안내 Banner, 하단 상태 Bar만 유지합니다.

## 지도와 마커 확인

1. 백엔드를 `dev` 프로필로 실행합니다.
2. 프론트엔드를 실행하고 Local 또는 같은 Wi-Fi의 Network URL에 접속합니다.
3. 통합 홈 중간의 실제 OSM 지도에서 마커를 클릭합니다.
4. 상세 패널에서 이름, 주소, 카테고리, 운영 상태와 운영 기간을 확인합니다.
5. 상세를 확인한 뒤 별도 버튼으로 오늘 일정에 추가하고, 닫기 버튼으로 패널을 닫을 수 있습니다.

### GPS 버튼 상태와 방향 표시

- `idle`: 위치 추적 전 상태입니다. 첫 클릭은 최근 60초 안의 유효 좌표를 먼저 재사용하고, 없으면
  이전 MacBook 정상 동작 방식과 같은 하나의 `watchPosition`을 단독으로 먼저 시작합니다.
  watcher가 위치를 제공하지 못했을 때만 최근 24시간 내 브라우저 위치 캐시, Wi-Fi 위치를 허용한
  저정밀 `getCurrentPosition`, 고정밀 요청 순서로 넘어갑니다. 권한 거부는 즉시 중단하고,
  `POSITION_UNAVAILABLE` 또는 timeout일 때만 다음 단계로 진행합니다.
- `north-follow`: 현재 위치를 중심으로 추적하되 지도는 북쪽을 위로 유지합니다.
- `heading-follow`: 진행 방향이 화면 위쪽을 향하도록 지도를 회전합니다.
- 사용자가 지도를 직접 움직이면 GPS watcher는 유지하고 follow만 해제됩니다.

Current Location Layer는 Accuracy Circle, Heading Cone, Heading Triangle, 현재 위치 Marker를 함께
관리합니다. Cone과 Triangle은 하나의 정규화된 heading(북쪽 0°, 동쪽 90°, 시계 방향)을 같은 지도
geometry로 사용합니다. 따라서 heading-follow에서 지도 회전과 아이콘 회전이 이중 적용되지 않습니다.
heading이 없으면 Cone과 Triangle만 숨기고 위치와 Accuracy Circle은 유지합니다. 휴대폰에서는
`deviceorientationabsolute`와 iOS compass heading을 우선하고 화면 회전 각도를 보정합니다.
정지·저속 상태의 GPS course는 불안정하므로 속도가 0.5m/s 이상일 때만 compass보다 우선합니다.

MacBook은 GPS 센서 대신 Wi-Fi·네트워크 기반 위치가 먼저 도착할 수 있어 최초 요청에서 캐시와
저정밀 위치를 허용합니다. 휴대폰은 같은 초기 흐름 이후 고정밀 watcher가 더 정확한 GPS 좌표를
제공하면 Marker를 갱신합니다. watcher 오류가 발생해도 이미 확보한 유효 좌표는 지우지 않으며,
컴포넌트 종료와 추적 종료 시 watcher ID를 정확히 한 번 정리합니다. 개발 모드 콘솔에는 secure
context, 요청 단계, 옵션, 오류 코드와 accuracy를 기록하지만 사용자 화면에는 내부 정보가 노출되지
않습니다.

## 익명 참여 지표

카드에는 조회수, 좋아요 수, 오늘 일정 담기 수가 표시됩니다. PopupStore CRUD 모델과 분리된 다음
테이블을 사용합니다.

- `popup_engagement_summary`: 팝업별 조회·좋아요·일정 추가 합계
- `popup_engagement_event`: 동일 세션 조회·일정 추가 중복 방지 이벤트
- `popup_like`: 익명 방문자별 좋아요 상태

Frontend는 개인정보가 없는 UUID를 사용합니다. `anonymousVisitorId`는 localStorage,
`sessionId`는 sessionStorage에 저장합니다. 정확한 GPS 좌표, 이동 경로, 원본 IP는 참여 지표에
저장하지 않습니다.

집계 기준:

- 조회수: 상세 Bottom Sheet가 실제로 열린 시점, 동일 팝업·세션당 한 번
- 좋아요: 동일 팝업·익명 방문자당 하나이며 다시 누르면 취소
- 일정 담기: 오늘 일정에 최초 추가된 시점, 제거 후 재추가해도 동일 세션에서는 한 번

API는 `/api/popup-stores/{popupStoreId}/engagement/view`, `/like`, `/plan-add`를 사용합니다.
팝업 목록 조회는 모든 참여 요약과 현재 방문자의 좋아요 상태를 일괄 조회하여 카드별 N+1 호출을
만들지 않습니다. 팝업 행에 대한 비관적 잠금과 트랜잭션으로 동일 팝업의 동시 집계 정합성을 유지합니다.

### 지금 주목할 팝업

`GET /api/popup-stores/featured?limit=4`는 카드별 추가 요청 없이 후보와 최근 참여 지표를 일괄
조회합니다. 최근 30일의 상세 조회 이벤트, 현재 남아 있는 최근 좋아요, 일정 추가 이벤트를 각각
`log1p`로 보정한 뒤 후보 집합의 최댓값으로 정규화하고 다음 가중치를 적용합니다.

- 조회 40%
- 좋아요 30%
- 일정 추가 30%

점수가 같으면 일정 추가, 좋아요, 조회, 운영 상태(운영 중 우선), 최근 ID 순으로 정렬합니다. 운영
종료 상태는 기본 후보에서 제외하며, 참여 데이터가 없는 초기 환경에서는 운영 중 팝업과 최근 ID가
보조 기준이 됩니다. 내부 점수는 화면에 표시하지 않습니다.

## OSM, OpenLayers, Valhalla

- OpenStreetMap(OSM)은 지도 화면과 경로 그래프의 원본 공간 데이터를 제공합니다.
- OpenLayers는 브라우저에서 OSM 타일, 팝업 마커, 현재 위치와 경로선을 표시합니다.
- Valhalla는 OSM 데이터로 보행 가능한 그래프를 만들고 선택 순서대로 도보 경로를 계산합니다.

Frontend는 Valhalla에 직접 접근하지 않습니다. `POST /api/routes/pedestrian` Backend 프록시를
호출하고, Backend만 로컬 Valhalla `/route` API에 접근합니다.

## Valhalla 로컬 실행

[Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/)과 Docker Compose가 필요합니다.
macOS에서는 Docker Desktop을 먼저 실행하고 Engine이 준비된 뒤 아래 명령으로 확인합니다.

```bash
docker --version
docker compose version
docker info
```

현재 Compose는 검증한 Valhalla 3.8.2 멀티 아키텍처 이미지 digest를 고정해 사용하며,
Apple Silicon(`arm64`)과 `amd64` 이미지를 모두 제공합니다. 프로젝트 루트에서 실행합니다.

```bash
docker compose pull
docker compose up -d valhalla
docker compose logs -f valhalla
docker compose ps
```

`ghcr.io/valhalla/valhalla-scripted` 이미지를 사용합니다. 최초 실행 시 BBBike의 서울 OSM PBF
추출본(약 49MB)을 내려받아 보행 그래프와 타일을 생성하므로 네트워크와 수 분의 준비 시간이 필요할 수
있습니다. 로그에 `Found config file. Starting valhalla service!`가 출력되고 `docker compose ps`가
`healthy`를 표시하기 전에는 Spring Boot 경로 API를 확인하지 마세요.
전국 데이터는 사용하지 않습니다. PBF, 그래프, 타일과 캐시는 `valhalla-data` Docker volume에
저장되어 Git에 포함되지 않습니다. 정상 재시작에서는 이 데이터를 재사용해 그래프를 다시 만들지 않습니다.

필요한 환경변수:

```bash
export VALHALLA_BASE_URL=http://localhost:8002
export VALHALLA_PORT=8002
export VALHALLA_SERVER_THREADS=2
export VALHALLA_CONNECT_TIMEOUT=3s
export VALHALLA_REQUEST_TIMEOUT=15s
```

`application-routing.properties`는 `RouteConfig`의 `@PropertySource`로 명시적으로 로드됩니다.
`VALHALLA_BASE_URL`은 Backend가 Valhalla에 접속하는 주소이며, 현재처럼 Spring Boot를 host에서
실행할 때 기본값 `http://localhost:8002`를 사용합니다. Docker 안에서 Backend까지
실행한다면 서비스 네트워크에 맞는 주소로 변경해야 합니다. 데이터 갱신이 필요하면 volume을 명시적으로
정리한 뒤 다시 생성하거나 공식 scripted 이미지의 rebuild 옵션을 사용하세요.

상태 확인과 직접 smoke test 예시:

```bash
curl http://localhost:8002/status
curl -X POST http://localhost:8002/route \
  -H 'Content-Type: application/json' \
  -d '{"locations":[{"lat":37.544581,"lon":127.055961},{"lat":37.545,"lon":127.05}],"costing":"pedestrian","units":"kilometers"}'
```

Spring Boot는 Valhalla가 `healthy`가 된 다음 실행합니다.

```bash
cd backend
VALHALLA_BASE_URL=http://localhost:8002 ./gradlew bootRun --args='--spring.profiles.active=dev'
```

일반 종료는 그래프 volume을 보존합니다.

```bash
docker compose down
```

아래 명령은 다운로드한 서울 PBF와 생성한 그래프를 함께 삭제합니다. 완전 재생성이 필요할 때만
사용하며, 다음 시작 시 PBF 다운로드와 그래프 생성이 다시 수행됩니다.

```bash
docker compose down -v
```

### Valhalla 문제 해결

- `Cannot connect to the Docker daemon`: Docker Desktop을 실행하고 `docker info`를 다시 확인합니다.
- `port is already allocated` 또는 8002 충돌: 점유 프로세스를 정리하거나 `VALHALLA_PORT`와
  Backend의 `VALHALLA_BASE_URL`을 같은 포트로 변경합니다.
- PBF 다운로드 실패: `docker compose logs valhalla`에서 BBBike URL과 네트워크 오류를 확인합니다.
- `health: starting`: 최초 그래프 생성 중입니다. 로그를 확인하고 완료될 때까지 기다립니다.
- Backend가 503을 반환: 먼저 `curl http://localhost:8002/status`를 확인하고, Backend 시작 시
  `VALHALLA_BASE_URL` 및 `application-routing.properties` 로딩을 확인합니다.
- 설정 파일 미로드가 의심되는 경우: Backend 로그와 `RouteConfig`의 `@PropertySource` 경로 및
  `routing.valhalla.*` 키를 확인합니다. 내부 Valhalla 오류나 URL은 사용자 응답에 노출되지 않습니다.

공개 서비스에서는 Valhalla CPU·메모리·디스크 용량을 별도로 산정하고 OSM 추출본과 그래프를
주기적으로 갱신해야 합니다.

## 다중 선택과 도보 경로 찾기

1. 카드의 `+ 일정`, 마커 상세의 `오늘 일정에 추가`, 일정 패널의 선택 메뉴로 방문지를 추가합니다.
2. 방문지는 최소 2개, 최대 8개까지 선택할 수 있으며 같은 장소는 중복 추가되지 않습니다.
3. 출발지를 `성수역`, `현재 위치`, `첫 번째 선택 팝업` 중에서 선택합니다. 기본값은 성수역입니다.
4. 목록의 드래그 또는 위·아래 버튼으로 순서를 바꿀 수 있습니다.
5. `길안내 시작`을 누르면 Valhalla `sources_to_targets`의 실제 보행시간 행렬과 정확 Held–Karp
   open-route 알고리즘으로 방문 순서를 계산하고 상세 보행 경로를 이어서 생성합니다.
6. 출발지는 고정하고 마지막 방문지는 자유이며, 계산이 끝나면 상세 경로와 총 도보거리·예상 시간이 나타납니다.
7. 현재 위치 출발은 버튼을 누를 때 최초 좌표를 직접 확보하므로 React 상태 반영을 기다리다 요청이
   중단되지 않습니다. 위치를 얻지 못하면 API를 호출하지 않습니다.
8. 출발지·순서·선택 목록을 바꾸면 이전 결과가 무효화되며 자동 재요청하지 않습니다.

현재 위치 버튼은 `watchPosition` 추적을 시작하며 다시 누르면 지도를 현재 위치로 복귀시킵니다.
사용자가 지도를 드래그하면 free-pan 모드가 되고, `추적 종료`는 브라우저 watcher를 정리합니다.
현재 위치는 브라우저 메모리와 지도에만 유지되고 Backend나 DB에 저장되지 않습니다. Geolocation은
보안 정책상 `localhost` 또는 HTTPS에서만 정상 동작합니다. 위치 권한을 거부했다면 브라우저 사이트
설정에서 권한을 변경한 뒤 다시 시도하세요.

오류 안내는 권한 거부, 위치 사용 불가, 시간 초과, 브라우저 미지원, 안전하지 않은 HTTP 환경을
구분합니다. 권한 거부 시 사이트 설정을, 위치 사용 불가 시 위치 서비스와 네트워크를,
시간 초과 시 네트워크와 GPS 수신 상태를 확인하세요. LAN HTTP에서는 수동 출발지 경로를 사용할 수
있지만 실제 위치 확인은 localhost 또는 위의 HTTPS 터널에서 테스트해야 합니다.

거리와 예상 시간은 OSM 보행 네트워크 기반이며 실제 보행 환경과 다를 수 있습니다. `길안내 시작`은
실시간 GPS를 상세 경로에 투영해 남은 거리·시간과 Valhalla maneuver 안내를 갱신합니다. 경로에서
35m를 넘는 상태가 정확도 50m 이내에서 3회 연속 확인되면 현재 위치부터 남은 방문지까지 자동
재탐색하며, 재호출 간격은 최소 30초입니다. GPS 오차와 보행 네트워크 상태에 따라 실제 안내와 차이가
있을 수 있으며 상용 내비게이션이나 실시간 교통 안내를 대신하지 않습니다.

## 반응형 확인 기준

Mobile Header는 로고·메뉴 행과 48px 검색 버튼을 포함한 검색 행으로 나뉩니다. 지도 상세, 오늘 일정,
Navigation 상태에 따라 GPS FAB 위치를 조정해 Dock과 Sheet를 가리지 않으며, Map Drawer가 열린
동안에는 GPS 버튼만 위쪽에 유지하고 나머지 지도 조작 버튼은 Drawer를 닫은 뒤 다시 사용할 수 있습니다.
카드 Carousel은 컨테이너 내부에서만 가로 스크롤하고 페이지 자체에는 수평 스크롤을 만들지 않습니다.

검증 기준 viewport는 `320×568`, `360×800`, `375×812`, `390×844`, `393×852`, `412×915`,
`430×932`, Tablet `768×1024`, Landscape `844×390`, `915×412`입니다. Mobile 상세는 `100dvh`와
safe area를 기준으로 내부만 스크롤하고, Navigation 상·하단 UI는 320px에서도 종료·일시정지 버튼이
viewport 안에 남도록 배치합니다.

프론트엔드는 `GET /api/popup-stores/search?page=0&size=100&sort=createdAt,desc` 응답의
`content` 배열을 사용합니다. 좌표가 없거나 유효 범위를 벗어난 항목은 오류 없이 마커에서 제외합니다.

## 검증 명령

```bash
cd backend
./gradlew build
./gradlew test

cd ../frontend
npm test
npm run build
npm run lint
```

## 아직 구현하지 않은 기능

- 8개를 초과하는 대규모 방문지 휴리스틱 최적화
- 서버 저장형 여행 계획 및 상용 수준 음성/백그라운드 내비게이션
- 즐겨찾기·방문 기록·방문 기반 리뷰·통합 마이페이지
