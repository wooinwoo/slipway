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
  <a href="#부품">부품</a> ·
  <a href="#프리셋">프리셋</a> ·
  <a href="docs/codepack.md">문서</a>
</p>

## 특징

- **바로 실행.** 서버, DB, API 키 없이 브라우저 Mock API로 뜹니다.
- **제품까지 같은 코드.** Mock과 NestJS 서버가 같은 `/api/*` 계약을 씁니다. `VITE_API_URL` 하나로 전환합니다.
- **화면은 부품으로.** 템플릿에 완성된 화면은 없습니다. 앱 틀, 로그인, 표, 필터, 차트, 보드, 폼 등 23개 부품으로 조립합니다.
- **한국어 기본값.** 카카오·네이버 로그인, 전화번호·사업자번호·금액·주소 입력, 한국어 검증 메시지.
- **AI와 같이 쓰는 하네스.** `AGENTS.md`, `REQ-n` 요구사항 추적, `pnpm verify`, `pnpm shots`.

## 빠른 시작

```sh
node scripts/create-project.mjs ../my-app --name "주문 관리"
cd ../my-app
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Node.js 22.23.4 이상, pnpm 10.33.2가 필요합니다. 실제 API까지 함께 시작하려면 `--preset mono`를 붙입니다.

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
