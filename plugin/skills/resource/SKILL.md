---
name: resource
description: Slipway 프로젝트에 리소스의 데이터 층(DB 테이블·마이그레이션·API·Mock·조회/저장 훅·계약 테스트)을 추가하고, 화면은 부품으로 조립한다. "주문 관리 추가해줘", "예약 테이블 만들어줘"처럼 데이터를 만들고 고치는 기능을 요청할 때 트리거.
---

# slipway:resource

Slipway로 만든 프로젝트 루트(`scripts/gen.mjs`가 있음)에서 실행한다. 없으면 Slipway의 new 스킬(`/slipway:new`)로 프로젝트부터 만들도록 안내한다.

## 1. 필드 정하기

요청에서 리소스 이름(영문 복수형), 한글 이름, 필드를 뽑는다. 애매하면 추측한 필드 목록을 보여 주고 한 번만 확인한다.

- 필수 필드가 하나 이상 있어야 한다(생성되는 테스트가 그 검증을 확인).
- 타입: `text`, `textarea`, `email`, `phone`, `number`, `won`, `date`, `time`(HH:MM), `enum(a|b|c)`, `ref(<plural>)`
- 이름 뒤 `?`는 선택 입력: `dueAt?:date:납기`

## 2. 생성

```sh
corepack pnpm gen resource <plural> <한글 이름> --fields "<name>[?]:<type>:<라벨> ..."
```

- 타입: `text`, `textarea`, `email`, `phone`, `number`, `won`, `date`, `time`(HH:MM), `enum(a|b|c)`, `ref(<plural>)`. 이름 뒤 `?`는 선택 필드.
- 필드는 공백으로 나누므로 라벨 안의 띄어쓰기는 `_`로 쓴다(`startTime:time:시작_시간` → "시작 시간").
- 단수형은 자동으로 만든다(`classes` → `class`, `categories` → `category`). 다르면 `--singular person`.
- 다른 리소스를 가리키는 필드(예약의 수업)는 `classId:ref(classes):수업`. 가리키는 리소스를 먼저 생성한다(`package.json`의 `slipway.resources`에 기록된다).
  API와 Mock이 같은 사용자의 행인지 확인하고("수업을 찾을 수 없습니다"), 그 행을 지우면 가리키던 행도 지운다(DB 외래 키, Mock). 생성 테스트는 가리킬 행을 먼저 만든다.
  정원 같은 업무 규칙은 생성된 Mock 핸들러(`src/entities/<plural>/mock.ts`)와 API 서비스에 직접 넣는다.
- `node scripts/gen.mjs`를 인자 없이 돌리면 이 문법이 나온다.

만들어지는 것(프리셋에 있는 층만). 화면은 만들지 않는다.

- 웹: `src/entities/<plural>/api.ts`(스키마·조회·저장·삭제 훅), `src/entities/<plural>/mock.ts`(Mock 엔드포인트)와 Mock 테이블, `e2e/<plural>-api.e2e.ts`(Mock과 실제 API에 같은 요청)
- API: `src/contracts/<plural>.ts`, `src/db/schema.ts`의 테이블과 마이그레이션, `src/<plural>/` 모듈(사용자별로 분리), `test/<plural>.e2e-spec.ts`
- mono: 스키마는 `packages/shared/src/<plural>.ts` 한 곳

## 3. 화면 조립

화면은 이 스킬을 쓰는 AI가 요구사항에 맞게 `src/patterns/` 부품으로 조립한다. 생성된 훅(`<plural>Query`, `useSave<Single>`, `useDelete<Plural>`)을 연결한다.

- 목록: `AdvancedTable`(정렬·선택·일괄 처리), `FilterBar`, `SearchInput`
- 상세·수정: `DetailPanel`, `RecordForm`(필드 오류는 `ApiError.fields`), `ConfirmAction`
- 그 밖: `StatusBoard`, `MetricGrid`, `ChartPanel`, `Timeline`
- 사용자가 하는 동작(예약 받기, 출석 체크)은 `src/features/<동작>/`, 화면은 `src/routes/_app/...`에서 기능을 조립한다.
  계층은 아래로만 import한다(routes → features → entities → 공용). 메뉴는 앱의 탭·`AppShell` `nav`, 요구사항은 `REQ-n`과 E2E로 연결한다.

필드를 바꾸면 스키마(웹·API 공통), DB 테이블(`pnpm --dir <api> db:generate`), 화면, 테스트를 같이 바꾼다.

## 4. 검증

```sh
corepack pnpm verify
corepack pnpm shots /<plural>
```

캡처를 직접 보고 빈 목록·긴 한국어·모바일에서 깨지는 곳을 고친다.
