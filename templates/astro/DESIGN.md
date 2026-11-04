---
name: Slipway site
description: 소개·랜딩·문서 사이트의 기본 디자인 기준. 앱 프리셋과 같은 토큰을 쓴다.
colors:
  primary: "oklch(0.52 0.16 262)"
  background: "oklch(0.993 0.002 262)"
  foreground: "oklch(0.2 0.012 262)"
  muted-foreground: "oklch(0.52 0.015 262)"
  border: "oklch(0.92 0.006 262)"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  md: "0.5rem"
  xl: "0.875rem"
---

# Design System: Slipway site

## Overview

Slipway 앱 프리셋과 같은 토큰과 글꼴을 쓰되, 읽는 화면이라 글자를 키우고 여백을 넓힌다.
제품의 사용자·목적·톤은 `PRODUCT.md`에 있다. 구체적인 시각 방향(사진, 일러스트, 구성)은 프로젝트마다 정한다.
이 파일은 출발점이다. 다른 방향이 맞으면 이 파일과 `src/styles/global.css`를 먼저 다시 쓴다. 바뀌지 않는 것은 접근성·성능 관문뿐이다.

## Colors

`src/styles/global.css`의 시맨틱 토큰만 쓴다(`bg-primary`, `text-muted-foreground`). 다크 모드는 방문자 시스템 설정을 따른다.
강조는 주 행동 하나에만 브랜드 색을 쓴다.

## Typography

- 글꼴은 Pretendard 하나. 본문 17px 안팎, 줄 간격 1.7, 한 줄 40~45자(한국어 기준)를 넘기지 않는다.
- 제목은 `display` 크기에서 시작해 단계마다 줄인다. 한 페이지에 `<h1>` 하나.
- 전역 `word-break: keep-all`로 어절 단위 줄바꿈. 끄지 않는다.

## Layout

- 본문 폭 `max-w-3xl`(읽기), 섹션 폭 `max-w-6xl`. 섹션 사이 세로 여백은 넉넉하게(`py-20` 이상).
- 모바일 390px에서 가로 스크롤 없음. `pnpm check:ui`가 잡는다.

## Do's and Don'ts

### Do:
- 첫 화면에서 무엇인지와 다음 행동 하나를 분명히 한다.
- 실제 사진·화면·숫자를 쓴다. 이미지는 `<Image>`로 크기를 지정한다.
- 라이트·다크, 데스크톱·모바일을 `pnpm shots`로 보고 넘긴다.

### Don't:
- 근거 없는 수식어("혁신적인", "최고의"), 의미 없는 장식 그라데이션.
- 인라인 스크립트·스타일(CSP가 막는다).
- 색만으로 정보를 전달하기.
