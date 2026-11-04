---
name: screen
description: Slipway 프로젝트에서 화면 하나를 부품으로 조립한다. 목록·상세·폼·대시보드·보드·로그인·앱 틀 같은 화면을 PRODUCT.md와 DESIGN.md 기준으로 만들고, 캡처를 직접 본 뒤 UI 검사까지 통과시킨다. "○○ 화면 만들어줘", "목록 페이지 추가", "대시보드 만들어줘", "로그인 화면 붙여줘"에 트리거.
---

# slipway:screen

Slipway는 화면을 미리 만들어 두지 않는다. 화면의 구성과 디자인은 이 스킬을 쓰는 AI가 요구에 맞게 정한다.
결과는 그 프로젝트의 평범한 코드다.

## 1. 기준 읽기

- 프로젝트 루트의 `AGENTS.md`, `PRODUCT.md`(누가·왜·톤), `DESIGN.md`(토큰·타이포·레이아웃·부품 규칙), `CODEPACK.md`(부품 규약).
- `PRODUCT.md`가 비어 있으면 사용자·목적·톤을 한 번에 묻고 채운다.

## 2. 화면 정하기

만들기 전에 한 줄씩 정한다. 모르는 것만 묻는다.

- 목적과 주 행동 하나(예: "오늘 들어온 주문을 확인하고 배송 처리한다")
- 데이터: 어떤 리소스를 읽고 쓰는가. 데이터 층이 없으면 `/slipway:resource`로 먼저 만든다
- 상태: 빈 목록, 로딩, 오류, 권한 없음
- 누가 어디서 보는가: 데스크톱 위주인지, 휴대폰에서도 쓰는지

## 3. 부품 고르기

| 화면 | 부품 |
|---|---|
| 앱 틀 | `AppShell`(메뉴·브레드크럼·Ctrl/⌘+K·사용자 메뉴) |
| 로그인·가입 | `AuthCard`, `LoginForm`, `SignupForm`, `SocialButtons`, `GuestButton` |
| 목록 | `AdvancedTable`(정렬·선택·일괄 처리), `FilterBar` 또는 `SearchInput`, `DetailPanel`, `RecordForm`(Dialog 안), `ConfirmAction` |
| 대시보드 | `MetricGrid`, `ChartPanel`, `Timeline` |
| 진행 관리 | `StatusBoard` |
| 긴 입력 | `StepForm`, `RecordForm`, `kr-inputs`, `DateRangePicker`, `FileDrop` |
| 가져오기·내보내기 | `CsvImport`, `CsvExportButton` |
| 설정 | `ThemeSettings`와 shadcn `Card`·`Switch`·`Tabs` |

부품으로 안 되는 것은 `src/components/ui/`(shadcn 전체)로 만든다. 원색 클래스나 새 글꼴은 쓰지 않는다.

## 4. 조립

- **react·mono 웹**: `src/routes/_app/<name>/index.tsx`. `staticData: { title }`, `loader`에서 `ensureQueryData`,
  컴포넌트에서 `useSuspenseQuery`. 메뉴는 `AppShell`의 `nav`에 한 줄. 로그인·앱 틀이 아직 없으면 `CODEPACK.md`의
  "로그인과 앱 틀 조립"부터 한다.
- **next**: `src/app/(app)/<name>/page.tsx`에 `export const metadata = { title }`, 상호작용은 `"use client"` 컴포넌트로 나눈다.
  로그인 확인은 `(app)/layout.tsx`가 맡는다.
- 저장은 생성된 훅(`useSave<Single>`, `useDelete<Plural>`)으로. `ApiError.fields`는 `RecordForm`의 필드 오류로 돌려준다.
  결과는 `toast`로 알린다.
- 빈 상태는 `AsyncState`(다음 행동 버튼 포함), 오류는 라우트 오류 화면에 맡긴다.
- 금액은 `formatWon`, 숫자 열은 `tabular`, 문구는 짧고 평이한 한국어.

## 5. 요구사항과 테스트

`docs/requirements.md`에 `REQ-n`을 추가하고, 라우트 첫 줄에 `// REQ-n ...`, `e2e/`에 `test("REQ-n ...")`로
화면의 주 흐름(들어가기 → 주 행동 → 결과 확인)을 테스트한다.

## 6. 보고 고치기

```sh
corepack pnpm shots /<route>     # .shots/에 데스크톱·모바일 × 라이트·다크
```

캡처 네 장을 직접 연다. 정렬, 여백, 넘침, 빈 값, 긴 한국어, 다크 모드 대비를 보고 고친다.
Impeccable 스킬이 있으면 `/impeccable critique`로 비평을 받고 P0·P1을 고친다. 그다음:

```sh
corepack pnpm check:ui /<route>  # 접근성·대비·넘침·커서·포커스·콘솔 오류
corepack pnpm verify
```

캡처를 보기 전에는 화면이 잘 나왔다고 보고하지 않는다.

## 끝낼 때

라우트, 쓴 부품, 연결한 데이터, 추가한 `REQ-n`과 테스트, 캡처 경로, 남은 일을 짧게 알린다.
