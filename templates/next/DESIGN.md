---
name: Slipway
description: 업무용 웹 앱의 기본 디자인 시스템. 브랜드 색 하나로 전체를 다시 칠한다.
colors:
  primary: "oklch(0.52 0.16 262)"
  primary-foreground: "oklch(0.99 0.005 262)"
  background: "oklch(0.993 0.002 262)"
  foreground: "oklch(0.2 0.012 262)"
  card: "oklch(1 0 0)"
  muted: "oklch(0.965 0.005 262)"
  muted-foreground: "oklch(0.52 0.015 262)"
  accent: "oklch(0.955 0.025 262)"
  border: "oklch(0.92 0.006 262)"
  destructive: "oklch(0.58 0.22 27)"
  dark-background: "oklch(0.17 0.01 262)"
  dark-card: "oklch(0.205 0.012 262)"
  dark-primary: "oklch(0.68 0.136 262)"
typography:
  page-title:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  section-title:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  metric:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    rounded: "{rounded.md}"
    height: "36px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input:
    rounded: "{rounded.md}"
    height: "36px"
---

# Design System: Slipway

## Overview

조용하고 정돈된 업무 도구. 화면의 주인공은 데이터와 다음 행동이고, 장식은 없다. 브랜드는 색 한 가지(`--brand-h`)와
그 색이 살짝 섞인 중립색으로만 드러난다. 한국어 화면에서 읽기 편한 밀도를 기준으로 한다.

이 파일은 Slipway 부품을 조합해 화면을 만들 때의 기준이다. 제품의 사용자·목적·톤은 프로젝트 루트의 `PRODUCT.md`에 있다.
제품에 맞게 바꿀 때는 `src/index.css`의 토큰을 먼저 바꾸고 이 파일의 값을 같이 고친다.

## Colors

모든 색은 `src/index.css`의 시맨틱 토큰으로 쓴다. 클래스는 `bg-primary`, `text-muted-foreground`, `border`처럼 쓰고
`bg-blue-600`이나 hex 값을 직접 쓰지 않는다. 다크 모드 값은 `.dark`에 따로 있다.

### Primary
브랜드 색. 화면에서 가장 중요한 행동 하나(저장, 새로 만들기)와 선택된 메뉴, 포커스 링에만 쓴다.
`--brand-h`(색상)와 `--brand-c`(채도) 두 숫자로 전체가 다시 칠해진다.

### Neutral
배경·카드·테두리·보조 글자는 브랜드 색이 아주 조금 섞인 중립색이다. 완전한 회색을 새로 만들지 않는다.

### Named Rules
- **상태 색**: 성공·진행·주의는 Badge 변형과 아이콘으로 구분하고, 색만으로 의미를 전하지 않는다. 상태 점(dot)은 원색을 써도 되는 유일한 예외다.
- **파괴적 행동**: `destructive`는 되돌릴 수 없는 삭제에만 쓴다.
- **차트**: `--chart-1`~`--chart-5` 순서로 쓴다. 계열이 다섯을 넘으면 차트를 나눈다.

## Typography

글꼴은 Pretendard Variable 하나다. 새 글꼴을 들이지 않는다.

### Hierarchy
- 페이지 제목: `text-2xl font-semibold tracking-tight`. 화면마다 하나(`PageHeader`).
- 구역 제목: `text-sm font-semibold`. 카드·패널 머리.
- 본문: `text-sm`. 표, 폼, 설명.
- 보조: `text-xs text-muted-foreground`. 캡션, 도움말, 시간.
- 지표: `text-3xl font-semibold tracking-tight`(`MetricGrid`).

### Named Rules
- **숫자 정렬**: 표와 카드의 숫자에는 `tabular` 클래스를 붙인다. 금액은 `formatWon`·`formatWonKorean`·`formatWonCompact`, 시간은 `formatRelative`.
- **한국어 줄바꿈**: 전역에 `word-break: keep-all`이 걸려 있어 어절 단위로 줄이 바뀐다. 긴 낱말은 `overflow-wrap`이 받는다. 개별 요소에서 끄지 않는다.

## Layout

- 앱 화면은 `AppShell` 안에 둔다. 본문은 최대 너비 `max-w-6xl`, 여백 `px-4 py-6`(md 이상 `px-8 py-8`).
- 세로 간격은 구역 사이 `gap-6`, 구역 안 `gap-3`~`gap-4`. 4px 배수만 쓴다.
- 모바일 390px에서 가로 스크롤이 생기면 안 된다(표 자체의 가로 스크롤은 예외). `pnpm check:ui`가 잡는다.
- 목록 화면은 제목·주 행동 → 검색·필터 → 표 순서. 상세는 오른쪽 `DetailPanel`, 생성·수정은 `Dialog` 안의 `RecordForm`.

## Elevation & Depth

평면이 기본이다. 구분은 테두리(`border`)와 배경 단계(`background` → `card` → `muted`)로 한다.
그림자는 떠 있는 것(드롭다운, 팝오버, 토스트, 다이얼로그)에만 쓰며 부품에 이미 들어 있다.

## Shapes

곡률은 `--radius`(0.625rem) 하나에서 나온다. 카드·패널 `rounded-xl`, 버튼·입력 `rounded-md`, 배지 `rounded-full`.

## Components

부품 목록과 연결 규약은 `CODEPACK.md`에 있다. 새 UI를 만들기 전에 `src/patterns/`와 `src/components/ui/`(shadcn 전체)에서 먼저 찾는다.

### Buttons
- 한 화면에 primary 버튼은 하나. 나머지는 `outline`·`ghost`.
- 비동기 동작 중에는 버튼을 막고 `Spinner`를 앞에 둔다.
- 문구는 동사로 끝낸다: "저장", "주문 추가", "삭제".

### Cards / Containers
`rounded-xl border bg-card p-5`. 카드 안에 카드를 겹치지 않는다.

### Inputs / Fields
라벨은 위, 오류는 아래(`text-xs text-destructive`), 도움말은 오류가 없을 때만. 서버 필드 오류(`ApiError.fields`)는 같은 칸에 보인다.
전화번호·사업자번호·금액·주소는 `kr-inputs`를 쓴다.

### Navigation
사이드바 메뉴와 Ctrl/⌘+K는 `AppShell`의 `nav` 하나로 같이 바뀐다. 페이지마다 `metadata.title`을 둔다.

### States
빈 목록·로딩·오류는 `AsyncState`, 확인이 필요한 행동은 `ConfirmAction`, 결과 알림은 `toast`(sonner, 위 가운데).
모든 목록 화면에 빈 상태와 오류 상태가 있어야 한다.

## Do's and Don'ts

### Do:
- 문구는 짧고 평이하게. 무엇이 일어났고 다음에 무엇을 하면 되는지 말한다.
- 라이트·다크, 데스크톱·모바일 네 가지를 `pnpm shots`로 보고 넘긴다.
- 긴 한국어, 빈 값("—"), 숫자 0과 음수를 넣어 본다.

### Don't:
- 원색 클래스, 그라데이션 배경, 유리 효과, 장식 일러스트를 넣지 않는다.
- 화면 안에 구현 설명이나 파일 경로를 쓰지 않는다.
- 아이콘만 있는 버튼에 이름(`aria-label`)을 빼먹지 않는다.
- 색만으로 상태를 구분하지 않는다.
