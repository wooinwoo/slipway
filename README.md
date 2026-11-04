<p align="center">
  <img src="docs/images/banner.png" alt="Slipway" width="100%">
</p>

<p align="center">
  <b>React · NestJS 셋업 코드와 화면 부품</b><br>
  서버 없이 첫 화면을 띄우고, 같은 코드로 제품까지 갑니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/NestJS-12-e0234e?logo=nestjs&logoColor=white" alt="NestJS 12">
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
</p>

<p align="center">
  <a href="#빠른-시작">빠른 시작</a> ·
  <a href="#리소스-생성">리소스 생성</a> ·
  <a href="#부품">부품</a> ·
  <a href="#프리셋">프리셋</a> ·
  <a href="docs/codepack.md">문서</a>
</p>

## 특징

- **바로 실행.** 서버, DB, API 키 없이 브라우저 Mock API로 뜹니다.
- **명령 하나로 DB·API·화면.** `pnpm gen resource orders 주문 --fields "..."`가 테이블과 마이그레이션, NestJS API, Mock, 목록·상세·폼 화면, 테스트를 한 번에 만듭니다. 결과는 바로 고칠 수 있는 평범한 코드입니다.
- **제품까지 같은 코드.** Mock과 NestJS 서버가 같은 `/api/*` 계약을 씁니다. `VITE_API_URL` 하나로 전환합니다.
- **화면은 부품으로.** 템플릿에 완성된 화면은 없습니다. 앱 틀, 로그인, 표, 필터, 차트, 보드, 폼 등 23개 부품으로 조립합니다.
- **한국어 기본값.** 카카오·네이버 로그인, 전화번호·사업자번호·금액·주소 입력, 한국어 검증 메시지.
- **어디든 배포.** 한 이미지로(`Dockerfile`), 웹·API 따로(`Dockerfile.api` + 정적 호스팅), VPS 한 대로(`compose.yaml`). AWS, Cloudflare, Vercel, Railway, iwinv 어디든 올라갑니다.
- **AI와 같이 쓰는 하네스.** `AGENTS.md`(Claude Code는 `CLAUDE.md`로 같은 파일을 읽음), `REQ-n` 요구사항 추적, `pnpm verify`, `pnpm shots`.

## 빠른 시작

```sh
node scripts/create-project.mjs ../my-app --name "주문 관리"
cd ../my-app
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Node.js 22.23.4 이상, pnpm 10.33.2가 필요합니다. 실제 API와 DB까지 함께 시작하려면 `--preset mono`를 붙입니다.

앱은 Slipway 바깥, 지정한 폴더에 만들어집니다. Slipway 저장소에서 AI에게 "앱 만들어 줘"라고 해도 같은 명령으로 옆 폴더에 만들고 그 안에서 작업합니다.

## 리소스 생성

```sh
corepack pnpm gen resource orders 주문 --icon Receipt \
  --fields "title:text:주문명 customer:text:고객 amount:won:금액 status:enum(접수|배송중|완료):상태 dueAt?:date:납기"
```

필드 타입은 `text` `textarea` `email` `phone` `number` `won` `date` `enum(a|b)`이고, 이름 뒤 `?`는 선택 입력입니다.
프리셋에 있는 층만 만듭니다. 처음 실행하면 로그인·회원가입·앱 틀도 함께 생깁니다.

| 층 | 만들어지는 것 |
|---|---|
| 스키마 | zod 규칙 한 벌. mono는 `packages/shared`에 두고 웹과 API가 같이 씁니다 |
| DB·API | Drizzle 테이블과 마이그레이션, 로그인한 사용자 데이터만 다루는 CRUD, 계약 테스트 |
| 웹 | Mock 핸들러, 검색·정렬·일괄 삭제 목록, 상세 패널, 추가·수정 폼, 메뉴, E2E 테스트, `REQ-n` |

## Claude Code 플러그인

```
/plugin marketplace add wooinwoo/slipway
/plugin install slipway@slipway
```

`/slipway:new`는 만들 앱, 프리셋, 화면 초안 여부, 배포 대상을 먼저 묻고 프로젝트 생성부터 검증까지 진행합니다.
모바일 소비자 앱이라면 [k-style-ui-ux](https://github.com/vmc-inner-circle/k-style-ui-ux)로 화면 초안을 먼저 만들도록 권합니다.
`/slipway:resource`는 리소스를, `/slipway:deploy`는 배포를 맡습니다. Codex·Cursor는 `AGENTS.md`의 같은 흐름을 따릅니다.

## 부품

생성한 프로젝트의 `src/patterns/`에 모두 들어 있습니다. 부품은 값과 콜백만 받고, API 호출과 화면 이동은 라우트가 정합니다.

| 분류 | 부품 |
|---|---|
| 화면 틀 | `app-shell` `auth` `theme-settings` |
| 목록 | `table` `advanced-table` `filters` `board` |
| 입력 | `form` `wizard` `date-range` `files` `kr-inputs` |
| 보기 | `details` `metrics` `chart` `timeline` |
| 상태 | `async-state` `confirm` |
| 데이터 | `csv` `csv-utils` `kr-format` `api-client` |
| 기반 | `theme` |

이미 있는 프로젝트에는 필요한 부품만 가져옵니다. `copy`는 부품이 쓰는 파일까지 따라가 복사하고, 내 파일과 겹치면 아무것도 쓰지 않고 멈춥니다.

```sh
node scripts/pack.mjs show app-shell auth
node scripts/pack.mjs copy app-shell auth --to ../my-app/src
```

입력·콜백 규약, 로그인과 앱 틀 조립 코드, 조합 예시는 [부품 사용법](docs/codepack.md)에 있습니다.

## 프리셋

| `--preset` | 구성 |
|---|---|
| `react` (기본) | Vite 8 · React 19 · TanStack Router · TanStack Query · Tailwind CSS 4 · shadcn · MSW |
| `mono` | 웹 + NestJS API + 공통 zod 스키마 패키지, Turborepo |
| `nest` | NestJS 12 · Drizzle · PGlite 또는 Postgres · 이메일·게스트·카카오·네이버 인증 |

## 문서

- [부품 사용법](docs/codepack.md): 부품 규약, 로그인·앱 틀 조립, 조합 예시
- [개발·검증 기준](docs/feature-workflow.md): 요청 하나를 요구사항부터 E2E까지 끝내는 순서
- [배포](docs/deploy.md): 정적 호스팅, 컨테이너, VPS 한 대
- [제품 기준](PRODUCT.md): Slipway가 지키는 방향

<details>
<summary>Slipway 자체를 고칠 때</summary>

<br>

원본은 `templates/react`와 `templates/nest`입니다. 고친 뒤 `node scripts/sync-mono.mjs`로 mono를 다시 만듭니다.
부품은 [`codepack/catalog.json`](codepack/catalog.json)에 등록하고, 동작은 앱과 분리된 `fixtures/parts/`에서 테스트합니다.

```sh
node scripts/pack.mjs check
corepack pnpm --dir templates/mono install --frozen-lockfile
corepack pnpm --dir templates/mono --filter @slipway/web exec playwright install firefox
corepack pnpm verify
```

대표 그림의 원본은 `docs/images/banner.html`입니다.

</details>
