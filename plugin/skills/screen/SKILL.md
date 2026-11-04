---
name: screen
description: Slipway 프로젝트에서 화면 하나를 만든다. 기능은 Slipway 부품과 생성된 데이터 훅으로 조립하고, 모양은 디자인 하네스(모바일 앱은 k-style-ui-ux, 웹은 Impeccable)로 정한 뒤, 캡처·UI 검사·실제 클릭까지 확인한다. "○○ 화면 만들어줘", "목록 페이지 추가", "대시보드 만들어줘", "로그인 화면 붙여줘"에 트리거.
---

# slipway:screen

Slipway는 화면도 디자인 기준도 주지 않는다. 부품과 데이터 층만 준다. 화면이 무엇을 하는지는 요구사항에서,
어떻게 보이는지는 디자인 하네스에서 정한다. 이 스킬을 쓰는 AI가 자기 취향으로 스타일을 정하지 않는다.

## 1. 디자인 하네스 준비

- 모바일 앱(휴대폰에서 주로 쓰는 화면, flutter 셸 포함)은 k-style-ui-ux로 디자인한다. `out/`가 아직 없으면 PRD로 `/k-style-ui-ux:go`를
  먼저 돌린다. 이 화면에 해당하는 `out/screens/<id>.html`과 고른 팔레트가 기준이다.
- 데스크톱 웹·랜딩·문서는 Impeccable로 디자인한다. `PRODUCT.md`·`DESIGN.md`가 없으면 Impeccable의 흐름(`/impeccable init`,
  새 화면이면 `shape`)으로 사용자와 함께 먼저 만든다. 이 두 파일은 하네스가 쓰고, Slipway는 내용을 정하지 않는다.
- 하네스가 설치돼 있지 않으면 설치를 권하고, 설치 전에는 스타일을 지어내지 않는다.

## 2. 화면이 할 일 정하기

모르는 것만 묻는다.

- 목적과 주 행동 하나(예: "오늘 들어온 주문을 확인하고 배송 처리한다")
- 데이터: 어떤 리소스를 읽고 쓰는가. 데이터 층이 없으면 resource 스킬로 먼저 만든다
- 상태: 빈 목록, 로딩, 오류, 권한 없음
- 누가 어디서 쓰는가: 기기, 상황
- 로그인 화면이라면 어떤 로그인 방식이 필요한지(이메일만, 소셜, 게스트 시연). 필요 없는 버튼은 넣지 않는다
- 로고: 사용자가 준 로고 파일만 쓴다. `corepack pnpm brand <파일>`이 `public/`에 넣고 파비콘으로 잡으며, 화면에는 `AppShell`의 `logo`로 넘긴다.
  없으면 이름을 글자로 두고 로고 파일을 요청한다.
  첫 글자를 도형에 넣은 마크나 아무 아이콘을 로고처럼 쓰는 일은 하지 않는다. 파비콘·앱 아이콘도 같다

## 3. 기능 조립

부품은 기능 단위다. 쓰거나 고치거나 안 써도 된다. 모양은 5단계에서 하네스가 정한다.

| 기능 | 부품 |
|---|---|
| 앱 틀 | `AppShell`(메뉴·브레드크럼·Ctrl/⌘+K·사용자 메뉴) |
| 로그인·가입 | `LoginForm`, `SignupForm`, 필요할 때만 `SocialButtons`·`GuestButton`, 틀은 `AuthCard` 또는 직접 |
| 목록 | `AdvancedTable`(정렬·선택·일괄 처리), `FilterBar`, `SearchInput` |
| 상세·수정 | `DetailPanel`, `RecordForm`, `ConfirmAction` |
| 수치 | `MetricGrid`, `ChartPanel` |
| 진행 관리 | `StatusBoard`, `Timeline` |
| 긴 입력 | `StepForm`, `kr-inputs`, `DateRangePicker`, `FileDrop` |
| 가져오기·내보내기 | `CsvImport`, `CsvExportButton` |
| 설정 | `ThemeSettings` |

- **react·mono 웹**: `src/routes/_app/<name>/index.tsx`. `staticData: { title }`, `loader`에서 `ensureQueryData`, 컴포넌트에서 `useSuspenseQuery`.
  메뉴는 `AppShell`의 `nav`. 로그인 확인은 레이아웃 라우트의 `beforeLoad`(CODEPACK.md "인증 연결").
- **next**: `src/app/(app)/<name>/page.tsx`, `export const metadata = { title }`, 상호작용은 `"use client"` 컴포넌트.
- 저장은 생성된 훅(`useSave<Single>`, `useDelete<Plural>`), `ApiError.fields`는 폼 필드 오류로 돌려준다.
- `docs/requirements.md`에 `REQ-n`, 라우트 첫 줄에 `// REQ-n ...`, `e2e/`에 `test("REQ-n ...")`로 주 흐름을 테스트한다.
  E2E에서 페이지를 옮길 때는 앱의 링크를 누른다(Mock 워커가 뜨는 동안 `page.goto`가 겹치면 Firefox가 이동을 취소한다).

## 4. 동작 확인

`corepack pnpm verify`가 통과하고, 사용자에게 줄 주소·모드 그대로 브라우저로 열어 주 흐름을 직접 눌러 본다
(로그인 → 화면 진입 → 주 행동 → 결과). Mock 모드는 https나 localhost에서만 동작한다.

## 5. 디자인

기능이 돌면 하네스의 디자인으로 모양을 짓는다. 이 스킬이 스타일을 덧붙이지 않는다.

- k-style-ui-ux: 고른 팔레트·글자·여백·곡률을 테마 토큰에 옮기고, `out/screens/<id>.html`의 구성(첫 화면 주인공, 블록 순서, 부품, 문구)을
  부품 조립으로 재현한다. 캡처를 그 화면 옆에 두고 비교한다.
- Impeccable: `DESIGN.md`와 하네스의 판단을 따른다.

```sh
corepack pnpm shots /<route>     # .shots/에 데스크톱·모바일 × 라이트·다크
```

캡처를 직접 열어 보고 P0·P1을 고친다(Impeccable이면 `/impeccable critique` 뒤 `polish`). 그다음:

```sh
corepack pnpm check:ui /<route>  # 접근성·대비·포커스·넘침·커서·콘솔 오류
corepack pnpm verify
```

## 끝낼 때

라우트, 연결한 데이터, 추가한 `REQ-n`과 테스트, 하네스가 정한 디자인 방향, 캡처 경로, 직접 눌러 본 결과, 남은 일을 짧게 알린다.
