---
name: resource
description: Slipway 프로젝트에 리소스의 데이터 층(DB 테이블·마이그레이션·API·Mock·조회/저장 훅·계약 테스트)을 추가하고, 화면은 부품으로 조립한다. "주문 관리 추가해줘", "예약 테이블 만들어줘"처럼 데이터를 만들고 고치는 기능을 요청할 때 트리거.
---

# slipway:resource

Slipway로 만든 프로젝트 루트(`scripts/gen.mjs`가 있음)에서 실행한다. 없으면 `/slipway:new`를 먼저 안내한다.

## 1. 필드 정하기

요청에서 리소스 이름(영문 복수형), 한글 이름, 필드를 뽑는다. 애매하면 추측한 필드 목록을 보여 주고 한 번만 확인한다.

- 필수 필드가 하나 이상 있어야 한다(생성되는 테스트가 그 검증을 확인).
- 타입: `text`, `textarea`, `email`, `phone`, `number`, `won`, `date`, `enum(a|b|c)`
- 이름 뒤 `?`는 선택 입력: `dueAt?:date:납기`

## 2. 생성

```sh
corepack pnpm gen resource <plural> <한글 이름> --fields "<name>[?]:<type>:<라벨> ..."
```

만들어지는 것(프리셋에 있는 층만). 화면은 만들지 않는다.

- 웹: `src/api/<plural>.ts`(스키마·조회·저장·삭제 훅), `src/mocks/handlers/<plural>.ts`와 Mock 테이블, `e2e/<plural>-api.e2e.ts`(Mock과 실제 API에 같은 요청)
- API: `src/contracts/<plural>.ts`, `src/db/schema.ts`의 테이블과 마이그레이션, `src/<plural>/` 모듈(사용자별로 분리), `test/<plural>.e2e-spec.ts`
- mono: 스키마는 `packages/shared/src/<plural>.ts` 한 곳

## 3. 화면 조립

화면은 이 스킬을 쓰는 AI가 요구사항에 맞게 `src/patterns/` 부품으로 조립한다. 생성된 훅(`<plural>Query`, `useSave<Single>`, `useDelete<Plural>`)을 연결한다.

- 목록: `AdvancedTable`(정렬·선택·일괄 처리), `FilterBar`, `SearchInput`
- 상세·수정: `DetailPanel`, `RecordForm`(필드 오류는 `ApiError.fields`), `ConfirmAction`
- 그 밖: `StatusBoard`, `MetricGrid`, `ChartPanel`, `Timeline`
- 라우트는 `src/routes/_app/<plural>/`, 메뉴는 `AppShell`의 `nav`, 요구사항은 `REQ-n`과 E2E로 연결한다.

필드를 바꾸면 스키마(웹·API 공통), DB 테이블(`pnpm --dir <api> db:generate`), 화면, 테스트를 같이 바꾼다.

## 4. 검증

```sh
corepack pnpm verify
corepack pnpm shots /<plural>
```

캡처를 직접 보고 빈 목록·긴 한국어·모바일에서 깨지는 곳을 고친다.
