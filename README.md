# Popup Store Map

성수역, 서울숲역, 뚝섬역 주변의 팝업스토어를 OpenStreetMap 지도에서 확인하는 서비스입니다.
현재는 팝업스토어 CRUD·검색 API, 지도 마커·상세정보, 선택 순서 기반 도보 경로 조회가 구현되어 있습니다.

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

```bash
cd backend
./gradlew bootRun
```

Swagger UI: <http://localhost:8080/swagger-ui/index.html>

### 개발 샘플 데이터와 dev 프로필

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

`dev` 프로필에서만 `PopupStoreDevDataInitializer`가 실행됩니다. 18개의 `[DEV]` 샘플을
Repository로 저장하며, 재시작할 때 각 샘플 이름이 이미 존재하는지 확인해 중복 삽입을 방지합니다.
일반 프로필과 운영 환경에서는 initializer와 개발용 CORS 설정이 활성화되지 않습니다.

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
./gradlew bootRun --args='--spring.profiles.active=dev'

# 터미널 2: Vite (0.0.0.0:5173 + /api proxy)
cd frontend
npm run dev

# 터미널 3
cloudflared tunnel --url http://127.0.0.1:5173
```

cloudflared가 출력한 `https://...trycloudflare.com` 주소를 휴대폰에서 엽니다. 이 HTTPS origin의
`/api`도 Vite proxy를 통해 로컬 Backend로 전달됩니다. Quick Tunnel URL은 인터넷에 공개되므로
개발용 샘플 데이터에만 사용하고, 비밀번호·API Key·개인정보를 입력하지 말며 검증 후 프로세스를
종료하세요. 운영 배포 수단으로 사용하지 않습니다.

## 지도와 마커 확인

1. 백엔드를 `dev` 프로필로 실행합니다.
2. 프론트엔드를 실행하고 Local 또는 같은 Wi-Fi의 Network URL에 접속합니다.
3. OSM 지도에 표시된 마커를 클릭합니다.
4. 상세 패널에서 이름, 주소, 카테고리, 운영 상태와 운영 기간을 확인합니다.
5. 닫기 버튼으로 상세 패널을 닫을 수 있습니다.

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

1. 마커 상세 패널의 `경로에 추가` 또는 경로 계획 패널의 선택 메뉴로 방문지를 추가합니다.
2. 방문지는 최소 2개, 최대 8개까지 선택할 수 있으며 같은 장소는 중복 추가되지 않습니다.
3. 출발지를 `성수역`, `현재 위치`, `첫 번째 선택 팝업` 중에서 선택합니다. 기본값은 성수역입니다.
4. 목록의 위·아래 버튼으로 순서를 바꿀 수 있습니다. `경로 찾기`는 이 순서를 그대로 사용합니다.
5. `최적 순서 추천`은 Valhalla `sources_to_targets`의 실제 보행시간 행렬과 정확 Held–Karp open-route
   알고리즘으로 원래 순서와 추천 순서를 비교합니다. 출발지는 고정하고 마지막 방문지는 자유이며,
   추천 적용 전 원래 거리·시간과 절약값을 확인할 수 있습니다.
6. `경로 찾기` 또는 `추천 순서 적용` 후 상세 도보 경로와 총 도보거리·예상 시간이 나타납니다.
7. 현재 위치를 출발지로 사용하려면 지도에서 `현재 위치` 버튼을 먼저 눌러야 합니다.
8. 출발지·순서·선택 목록을 바꾸면 이전 결과가 무효화되므로 경로를 다시 계산해야 합니다.

현재 위치 버튼은 `watchPosition` 추적을 시작하며 다시 누르면 지도를 현재 위치로 복귀시킵니다.
사용자가 지도를 드래그하면 free-pan 모드가 되고, `추적 종료`는 브라우저 watcher를 정리합니다.
현재 위치는 브라우저 메모리와 지도에만 유지되고 Backend나 DB에 저장되지 않습니다. Geolocation은
보안 정책상 `localhost` 또는 HTTPS에서만 정상 동작합니다. 위치 권한을 거부했다면 브라우저 사이트
설정에서 권한을 변경한 뒤 다시 시도하세요.

거리와 예상 시간은 OSM 보행 네트워크 기반이며 실제 보행 환경과 다를 수 있습니다. `길안내 시작`은
실시간 GPS를 상세 경로에 투영해 남은 거리·시간과 Valhalla maneuver 안내를 갱신합니다. 경로에서
35m를 넘는 상태가 정확도 50m 이내에서 3회 연속 확인되면 현재 위치부터 남은 방문지까지 자동
재탐색하며, 재호출 간격은 최소 30초입니다. GPS 오차와 보행 네트워크 상태에 따라 실제 안내와 차이가
있을 수 있으며 상용 내비게이션이나 실시간 교통 안내를 대신하지 않습니다.

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
- JWT 인증·인가
