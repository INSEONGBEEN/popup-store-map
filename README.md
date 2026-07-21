# Popup Store Map

성수역, 서울숲역, 뚝섬역 주변의 팝업스토어를 OpenStreetMap 지도에서 확인하는 서비스입니다.
현재는 팝업스토어 CRUD·검색 API와 지도 마커·상세정보 조회까지 구현되어 있습니다.

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

환경변수는 다음과 같이 백엔드 기본 URL을 지정합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

실제 `.env`는 Git에서 제외되며 `.env.example`만 공유합니다. 프론트 개발 서버의 API 호출은
백엔드를 `dev` 프로필로 실행할 때 `localhost:5173`과 `127.0.0.1:5173`에서만 허용됩니다.

## 지도와 마커 확인

1. 백엔드를 `dev` 프로필로 실행합니다.
2. 프론트엔드를 실행하고 <http://localhost:5173>에 접속합니다.
3. OSM 지도에 표시된 마커를 클릭합니다.
4. 상세 패널에서 이름, 주소, 카테고리, 운영 상태와 운영 기간을 확인합니다.
5. 닫기 버튼으로 상세 패널을 닫을 수 있습니다.

프론트엔드는 `GET /api/popup-stores/search?page=0&size=100&sort=createdAt,desc` 응답의
`content` 배열을 사용합니다. 좌표가 없거나 유효 범위를 벗어난 항목은 오류 없이 마커에서 제외합니다.

## 검증 명령

```bash
cd backend
./gradlew build
./gradlew test

cd ../frontend
npm run build
npm run lint
```

## 아직 구현하지 않은 기능

- 여러 팝업스토어 선택
- OSRM 기반 경로 계산 및 최적 방문 순서 추천
- 지도 경로선 표시
- JWT 인증·인가
