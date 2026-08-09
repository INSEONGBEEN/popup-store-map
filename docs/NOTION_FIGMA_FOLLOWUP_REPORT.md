# Popup Store Map — Notion Visual & Figma Follow-up Report

- 작업일: 2026-07-26
- 브랜치: `refactor/production-readiness`
- 기준 HEAD: `b7b1edfb4cda97724c0a46365ed9f9c68311bed6`
- 범위: Notion 시각화, Figma 산출물, 관련 문서의 사실관계 정리
- 애플리케이션 코드 변경: 없음

## A. Notion

- 부모 페이지: `토이프로젝트`
- 수정 페이지: `Popup Store Map`
- URL: [Notion Popup Store Map](https://app.notion.com/p/3a6f22d4b4c8800dab53f784d4d63b23)

최종 Section 구조는 기존 순서를 그대로 유지했다.

1. 📖 Project Overview
2. 🎨 UI Design (Figma)
3. 🏗️ System Architecture
4. 🗄️ Database (ERD)
5. 🔌 API Specification (Swagger)
6. 💻 Feature Implementation
7. 🧪 Testing
8. 🚀 Deployment
9. 🐞 Troubleshooting & Optimization
10. 📝 Retrospective

기존 링크 중심 본문을 `이미지 → 핵심 설명 → 핵심 포인트 → 상세 링크 1개` 흐름으로 재구성했다. 페이지를 다시 조회하여 이미지 블록, 10개 Section, Figma 링크와 부모 관계가 저장된 것을 확인했다.

### 직접 삽입한 이미지

- 통합 홈 Desktop
- 지도·다중 경로 Desktop
- 모바일 홈
- 모바일 로그인
- System Architecture
- ERD
- JWT Authentication Flow
- Valhalla Routing Flow
- Current / Target Deployment Architecture

이미지 삽입 실패 항목과 필수 수동 작업은 없다. Swagger는 별도 캡처를 억지로 만들지 않고 핵심 API Table로 표현했다.

## B. Figma

| 항목 | 결과 |
|---|---|
| Authentication | 성공 |
| Account | `injjang` |
| Seat | `View` |
| Read | 가능 |
| 새 Draft 생성·Write | 실제 호출로 가능 확인 |
| Design File | `Popup Store Map — Portfolio UI` |
| Figma URL | [Open Design](https://www.figma.com/design/aPPGnSFCyHihzF53uTCaOT) |

생성한 구조:

1. `01 Cover`
2. `02 Design System`
3. `03 Desktop`
   - Full application capture
   - `04 Map & Route / Presentation`
   - `05 Mobile / Responsive Experience`

Starter workspace의 3-page 제한 때문에 Map/Route와 Mobile을 별도 Page가 아닌 Desktop Page 내부 Frame으로 구성했다. Design System에는 편집 가능한 color swatch, typography, button, chip, search input, popup card 요소를 배치했다.

실제 React 화면 캡처와 대표 화면 이미지는 Figma에 정상 반영했다. Connector를 통한 새 Frame의 별도 preview/export 파일 생성은 `INVALID_ARGUMENT`로 지원되지 않았으므로, Notion에는 검증된 실제 UI Screenshot을 직접 사용하고 Figma 링크를 함께 제공했다.

## C. Visual Assets

- `docs/ui/assets/home-desktop.png`
- `docs/ui/assets/map-desktop.png`
- `docs/ui/assets/home-mobile.png`
- `docs/ui/assets/login-mobile.png`
- `docs/architecture/system-architecture.svg`
- `docs/architecture/deployment-architecture.svg`
- `docs/erd/erd.svg`
- `docs/flow/authentication-flow.svg`
- `docs/flow/routing-flow.svg`

## D. README

README 전체 구조는 변경하지 않았다. 실제 Figma 파일이 생성되었기 때문에 UI Design Section의 기존 “파일 생성 불가” 설명만 실제 상태와 URL로 최소 수정했다.

함께 수정한 `docs/ui/figma-spec.md`에는 Starter workspace의 3-page 제한과 실제 Page/Frame 구조를 기록했다.

## E. Git

- Branch: `refactor/production-readiness`
- 기준 HEAD: `b7b1edfb4cda97724c0a46365ed9f9c68311bed6`
- 수정: `README.md`
- 수정: `docs/ui/figma-spec.md`
- 신규/갱신: `docs/PORTFOLIO_DOCUMENTATION_REPORT.md`
- 신규: `docs/NOTION_FIGMA_FOLLOWUP_REPORT.md`
- Commit: 실행하지 않음
- Push: 실행하지 않음
- Application source 변경: 없음
- 임시 Figma capture script: 제거 완료
- 임시 Backend/Frontend server: 종료 완료

## F. Manual Actions Required

필수 수동 작업은 없다.

선택 사항으로 Figma에서 prototype interaction 또는 상태별 component variant를 더 확장할 수 있다. 이는 이번 시각 포트폴리오의 이해와 Notion 표시를 위해 필요한 작업은 아니다.
