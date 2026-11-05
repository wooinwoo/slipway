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
| 앱 틀 | 데스크톱: `AppShell`(메뉴·브레드크럼·Ctrl/⌘+K·사용자 메뉴). 휴대폰: `MobileShell`(폰 폭 한 칸·하단 탭·아래 고정 주 동작)과 `TopBar`(뒤로·제목) |
| 휴대폰 시트 | 아래에서 올라오는 시트는 `drawer`. 행·칩·블록 모양은 k-style 클래스(`k-row`·`k-chip`…)가 맡는다 |
| 로그인·가입 | `LoginForm`, `SignupForm`, 필요할 때만 `SocialButtons`·`GuestButton`, 틀은 `AuthCard` 또는 직접 |
| 목록 | `AdvancedTable`(정렬·선택·일괄 처리), `FilterBar`, `SearchInput` |
| 상세·수정 | `DetailPanel`, `RecordForm`, `ConfirmAction` |
| 수치 | `MetricGrid`, `ChartPanel` |
| 진행 관리 | `StatusBoard`, `Timeline` |
| 긴 입력 | `StepForm`, `kr-inputs`, `DateRangePicker`, `FileDrop` |
| 가져오기·내보내기 | `CsvImport`, `CsvExportButton` |
| 설정 | `ThemeSettings` |

- **react·mono 웹**: 화면은 `src/routes/_app/<name>/index.tsx`에서 기능을 조립만 한다. 폼·시트·규칙은 `src/features/<동작>/`,
  데이터 층은 `src/entities/<리소스>/`. 계층은 아래로만 import한다(ESLint가 막는다). `staticData: { title }`, `loader`에서 `ensureQueryData`, 컴포넌트에서 `useSuspenseQuery`.
  로그인 레이아웃의 `beforeLoad`는 `currentUser(context.queryClient)`가 null이면 로그인으로 보낸다(401만 로그아웃).
  메뉴는 `AppShell`의 `nav`. 로그인 확인은 레이아웃 라우트의 `beforeLoad`(CODEPACK.md "인증 연결").
- **next**: `src/app/(app)/<name>/page.tsx`, `export const metadata = { title }`, 상호작용은 `"use client"` 컴포넌트.
- 저장은 생성된 훅(`useSave<Single>`, `useDelete<Plural>`), `ApiError.fields`는 폼 필드 오류로 돌려준다.
- `docs/requirements.md`에 `REQ-n`, 라우트 첫 줄에 `// REQ-n ...`, `e2e/`에 `test("REQ-n ...")`로 주 흐름을 테스트한다.
  E2E에서 페이지를 옮길 때는 앱의 링크를 누른다(Mock 워커가 뜨는 동안 `page.goto`가 겹치면 Firefox가 이동을 취소한다).
  디자인이 진짜 radio·checkbox를 숨기고 꾸민 라벨을 보여 주면 라벨을 눌러 고르고 input이 checked인지 확인한다(숨은 input은 Playwright가 못 누른다).
  폼·완료 화면에는 탭바가 없으니 그 화면의 뒤로·닫기·링크로 나온다. 데모 계정으로 디자인의 시각에 화면을 여는 건 `e2e/demo.ts`의 `openAsDemo(page, path, { now })`.
  두 리소스를 엮는 계산(수업과 예약으로 남은 자리)은 그걸 보여 주는 기능(`src/features/<동작>/`)에 둔다.

## 4. 동작 확인

`corepack pnpm verify`가 통과하고, 사용자에게 줄 주소·모드 그대로 브라우저로 열어 주 흐름을 직접 눌러 본다
(로그인 → 화면 진입 → 주 행동 → 결과). Mock 모드는 https나 localhost에서만 동작한다.

사용자에게는 개발 서버(`pnpm dev`)가 아니라 빌드본을 넘긴다. 개발 서버는 파일 수백 개를 따로 보내서 첫 로딩이 몇 초에서 십몇 초 걸린다.
react는 `corepack pnpm build && corepack pnpm preview`, mono는 `corepack pnpm preview:demo`(Mock 빌드, `build:demo` 뒤).
넘기기 전에 그 주소가 몇 초 안에 뜨는지 재 본다.

보여 줄 데이터를 넣는다. 게스트는 빈 계정이라 화면이 비어 보인다. `src/mocks/db.ts`의 데모 계정(`u_demo`)에 시나리오 데이터를 심는다
(k-style이면 `out/journey.md`의 시나리오 데이터 표, 날짜는 오늘 기준으로 계산). `shots`와 `design:compare`는 데모 계정으로 들어간다.

## 5. 디자인

기능이 돌면 하네스의 디자인으로 모양을 짓는다. 이 스킬이 스타일을 덧붙이지 않는다.

- k-style-ui-ux: 아래 순서로 옮긴다. 손으로 값을 옮기거나 눈대중으로 맞추지 않는다.
  1. `corepack pnpm design out`: 토큰을 테마에, 부품 CSS를 `src/shared/design/k-style.css`(클래스마다 `k-` 접두사)에, 이미지를 `public/k-style/`에
     넣는다. 사용자가 캔버스에서 고른 팔레트는 `--palette <slug>`(`out/palettes.json`의 `seed-mindbody` 같은 값).
  2. `out/screens/<id>.html`을 마크업 그대로, 클래스에 접두사만 붙여 JSX로 옮긴다(`class="row"` → `className="k-row"`). HTML 파일을 앱에 복사하지 않는다.
     같은 명령이 만든 `src/shared/design/k-style.tsx`의 `KField`(라벨·입력·오류 줄과 aria), `KAvatar`(이름으로 고르는 준비된 그림, 이름 글자 금지), `KTabBar`를 쓴다.
     - 앱 바는 `KAppBar`(뒤로는 `useBack`), 탭바는 `KTabBar`(항목은 `src/widgets/tabs/`에 한 번). 날짜 문구는 `@/shared/lib/kr`의
       `formatDateLong`("11월 4일 수요일")·`formatDateShort`("11/4 수")·`formatDateWord`("오늘"·"내일").
     - 루트는 `<MobileShell className="k-screen k-has-tab">`(`<body>`의 클래스). 셸이 `<main>`이므로 디자인의 `<main class="page">`는 `<div className="k-page">`.
     - 디자인의 앱 바·탭바·하단 CTA·FAB 마크업(`k-appbar`·`k-tabbar`·`k-cta`·`k-fab`)을 그대로 쓴다. MobileShell의 `top`·`tabs`·`bottom`은
       그런 마크업이 없는 디자인용이다. 뒤로 버튼은 `useBack({ to: "/목록" })`, 탭바는 `KTabBar`, 디자인의 선 아이콘은 lucide(`strokeWidth={1.75}`).
     - 시트는 `<BottomSheet className="k-sheet" overlayClassName="k-dim">` 안에 손잡이와 `<BottomSheetTitle className="k-h2">`. 시트를 비교하려면 검색 파라미터로 열리게 한다.
     - 폼은 `KField` 안에 디자인의 `k-input`. 입력칸 글자를 그대로 상태로 두고 리소스 zod 스키마로 검사한다(숫자·원 칸은 "12"와 빈칸을 스스로 읽는다).
       `failureOf(parsed.error)`·`failureOf(error)`의 칸별 메시지는 `KField`의 `error`로, 칸이 없는 메시지는 버튼 위 `<KFormError failure={failure} />`로 보여 준다.
       디자인의 "둘러보기"는 `useDemoLogin()`(데모 계정과 심어 둔 데이터), 카카오·네이버는 `useSocialLogin()`(Mock과 실제 리다이렉트를 훅이 가른다).
     - 한 페이지는 `<plural>Query`, 목록 전체를 세거나 합치는 화면은 `all<Plural>Query()`, 상세는 `<singular>Query(id)`. 값 하나만 바꿔 저장할 때는
       `{ ...to<Single>Input(row), status }`. 디자인에 없는 것만 토큰 유틸리티로 짓고 색 값은 쓰지 않는다.
     - 홈 화면을 로그인 레이아웃 아래(`src/routes/_app/index.tsx`)에 두면 빈 `src/routes/index.tsx`는 지운다.
  3. 데모 계정에 `out/journey.md` 시나리오를 `src/mocks/scenario.ts`에 심는다(`demoRow({...})`가 주인·시각을 채운다, 날짜는 `isoDaysFrom`으로 오늘 기준,
     표에 수만 있으면 이름을 지어 채운다, 행 id는 고정). 아바타는 필드를 만들지 않는다: `KAvatar`가 이름으로 고르고, 시나리오가 그림을 정했으면
     시드 옆에 이름→파일 표를 둔다. 디자인의 시각은 `package.json`의 `"slipway": { "now": "2026-11-04T18:50" }`에 한 번. 상세 경로는
     `package.json`의 `"slipway": { "routes": [...] }`에 적어 `shots`·`check:ui`도 열게 한다.
  3-1. `corepack pnpm design:compare --now <시나리오 날짜·시각> /<route>=<id>.html ...`: 화면마다 디자인과 나란히 찍는다(`.shots/compare-<id>.png`).
     로그인 전 화면은 `--signed-out /login`. 다시 찍을 때 빌드를 건너뛰려면 `node scripts/ui.mjs compare ...`.
     다른 곳(배치·간격·글자 크기·빠진 블록·문구)을 고치고 다시 찍는다. 모든 화면이 맞을 때까지 넘기지 않는다. `--now`는 `shots`·`check:ui`에도 된다.
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
