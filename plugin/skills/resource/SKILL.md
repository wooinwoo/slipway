---
name: resource
description: Slipway 프로젝트에 리소스(DB 테이블·마이그레이션·API·Mock·목록/상세/폼 화면·테스트)를 추가한다. "주문 관리 추가해줘", "예약 테이블 만들어줘"처럼 데이터를 만들고 고치는 기능을 요청할 때 트리거.
---

# slipway:resource

Slipway로 만든 프로젝트 루트(`scripts/gen.mjs`가 있음)에서 실행한다. 없으면 `/slipway:new`를 먼저 안내한다.

## 1. 필드 정하기

요청에서 리소스 이름(영문 복수형), 한글 이름, 필드를 뽑는다. 애매하면 추측한 필드 목록을 보여 주고 한 번만 확인한다.

- 첫 필드는 이름 역할의 필수 `text`(목록 첫 열, 상세 제목).
- 타입: `text`, `textarea`, `email`, `phone`, `number`, `won`, `date`, `enum(a|b|c)`
- 이름 뒤 `?`는 선택 입력: `dueAt?:date:납기`
- 아이콘은 lucide 이름: `--icon Receipt`

## 2. 생성

```sh
corepack pnpm gen resource <plural> <한글 이름> --icon <Icon> --fields "<name>[?]:<type>:<라벨> ..."
```

만들어지는 것(프리셋에 있는 층만):

- 웹: `src/api/<plural>.ts`(스키마·쿼리), `src/mocks/handlers/<plural>.ts`, `src/routes/_app/<plural>/index.tsx`(검색·정렬·선택 삭제·상세·추가·수정), 메뉴(`src/nav.ts`), `e2e/<plural>.e2e.ts`, `REQ-n`
- API: `src/contracts/<plural>.ts`, `src/db/schema.ts`의 테이블과 마이그레이션, `src/<plural>/` 모듈(사용자별로 분리), `test/<plural>.e2e-spec.ts`
- mono: 스키마는 `packages/shared/src/<plural>.ts` 한 곳

## 3. 다듬기

생성 결과는 평범한 코드다. 요구사항에 맞게 직접 고친다: 열 순서, 검색 대상, 상세 항목, 문구, 다른 부품(보드·차트)으로 바꾸기.
필드를 바꾸면 스키마(웹·API 공통), DB 테이블(`pnpm --dir <api> db:generate`), 화면 필드, 테스트를 같이 바꾼다.

## 4. 검증

```sh
corepack pnpm verify
corepack pnpm shots /<plural>
```

캡처를 직접 보고 빈 목록·긴 한국어·모바일에서 깨지는 곳을 고친다.
