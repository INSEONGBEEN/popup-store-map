# Popup Store Map

성수역, 서울숲역, 뚝섬역 주변의 팝업스토어를 OpenStreetMap 지도에서 확인하는 서비스입니다.
현재는 팝업스토어 CRUD·검색 API, 지도 마커·상세정보, 선택 순서 기반 자동차 경로 조회가 구현되어 있습니다.

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
cp .env.example .env
npm install
npm run dev
```

프론트엔드: <http://localhost:5173>

환경변수는 백엔드와 OSRM 기본 URL을 지정합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_OSRM_BASE_URL=https://router.project-osrm.org
```

실제 `.env`는 Git에서 제외되며 `.env.example`만 공유합니다. 프론트 개발 서버의 API 호출은
백엔드를 `dev` 프로필로 실행할 때 `localhost:5173`과 `127.0.0.1:5173`에서만 허용됩니다.

## 지도와 마커 확인

1. 백엔드를 `dev` 프로필로 실행합니다.
2. 프론트엔드를 실행하고 <http://localhost:5173>에 접속합니다.
3. OSM 지도에 표시된 마커를 클릭합니다.
4. 상세 패널에서 이름, 주소, 카테고리, 운영 상태와 운영 기간을 확인합니다.
5. 닫기 버튼으로 상세 패널을 닫을 수 있습니다.

## 다중 선택과 경로 찾기

1. 마커 상세 패널의 `경로에 추가` 또는 경로 계획 패널의 선택 메뉴로 방문지를 추가합니다.
2. 방문지는 최소 2개, 최대 8개까지 선택할 수 있으며 같은 장소는 중복 추가되지 않습니다.
3. 목록의 위·아래 버튼으로 순서를 바꿀 수 있습니다. 표시된 선택 순서가 실제 방문 경로 순서입니다.
4. `경로 찾기`를 누르면 OSRM의 자동차 경로가 지도에 표시되고 총 거리와 예상 시간이 나타납니다.
5. 순서를 바꾸거나 장소를 제거하면 이전 결과가 무효화되므로 경로를 다시 계산해야 합니다.

기본 OSRM URL은 공개 데모 서버입니다. 개발·기능 확인 용도로만 사용하고 과도하게 호출하지 마세요.
거리와 예상 시간은 자동차 경로 기준이며 실제 교통 상황과 다를 수 있습니다. 현재는 선택한 순서를
그대로 사용하며 최적 방문 순서를 자동 계산하지 않습니다. 다음 단계에서 TSP 또는 최적 순서 추천을
검토할 예정입니다.

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

- TSP 기반 최적 방문 순서 추천
- JWT 인증·인가
