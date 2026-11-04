<p align="center">
  <img src="docs/images/banner.png" alt="Slipway" width="100%">
</p>

<p align="center">
  <b>React · Next · NestJS · Astro · Flutter 셋업 코드와 화면 부품</b><br>
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
  <a href="#사용법">사용법</a> ·
  <a href="#리소스-생성">리소스 생성</a> ·
  <a href="#품질-관문">품질 관문</a> ·
  <a href="#부품">부품</a> ·
  <a href="#프리셋">프리셋</a> ·
  <a href="docs/codepack.md">문서</a>
</p>

## 특징

- **바로 실행.** 서버, DB, API 키 없이 브라우저 Mock API로 뜹니다.
- **명령 하나로 DB·API.** `pnpm gen resource orders 주문 --fields "..."`가 테이블과 마이그레이션, NestJS API, Mock, 조회·저장 훅, 테스트를 한 번에 만듭니다. 화면은 만들지 않습니다. 부품으로 조립합니다.
- **제품까지 같은 코드.** Mock과 NestJS 서버가 같은 `/api/*` 계약을 씁니다. `VITE_API_URL` 하나로 전환합니다.
- **화면은 부품으로.** 템플릿에 완성된 화면은 없습니다. 앱 틀, 로그인, 표, 필터, 차트, 보드, 폼 등 23개 부품으로 조립합니다.
- **한국어 기본값.** 카카오·네이버 로그인, 전화번호·사업자번호·금액·주소 입력, 한국어 검증 메시지.
- **어디든 배포.** 한 이미지로(`Dockerfile`), 웹·API 따로(`Dockerfile.api` + 정적 호스팅), VPS 한 대로(`compose.yaml`). AWS, Cloudflare, Vercel, Railway, iwinv 어디든 올라갑니다.
- **품질 관문.** 접근성·대비·포커스·커서·넘침 검사, 번들 예산, Lighthouse 점수, 보안 헤더·요청 제한·운영 모드 보호가 `pnpm verify`와 CI에 들어 있습니다.
- **AI와 같이 쓰는 하네스.** `AGENTS.md`(Claude Code는 `CLAUDE.md`로 같은 파일을 읽음), `PRODUCT.md`·`DESIGN.md`(Impeccable 디자인 스킬과 같은 형식), `REQ-n` 요구사항 추적, `pnpm shots`.

## 사용법

Slipway는 도구 상자입니다. 앱은 Slipway 밖, 지정한 폴더에 독립 프로젝트로 만들어지고 각자 자기 레포가 됩니다.
화면은 미리 만들어 두지 않습니다. 부품을 쓰는 사람이나 AI가 요구에 맞게 조립합니다.

### 1. Claude Code 플러그인 (추천)

```
/plugin marketplace add wooinwoo/slipway
/plugin install slipway@slipway
```

대화는 이렇게 흘러갑니다.

```
/slipway:new 필라테스 예약 앱. 회원은 수업을 예약하고 강사는 일정과 출석을 관리해
    → 프리셋·디자인 도구·배포 대상을 묻고, 프로젝트 생성과 데이터 층(DB·API·Mock)까지
/slipway:screen 강사용 오늘 수업 목록. 예약 인원과 출석 체크
    → 부품으로 화면 조립, 캡처를 보고 고친 뒤 UI 검사 통과
/slipway:resource 수업 후기. 별점과 내용
/slipway:deploy Vercel에 웹, Railway에 API
```

| 명령 | 하는 일 |
|---|---|
| `/slipway:new` | 무엇을 만들지, 프리셋, 디자인 도구(Impeccable·k-style), 배포 대상을 먼저 묻고 프로젝트 생성부터 검증까지 |
| `/slipway:screen` | 화면 하나를 `PRODUCT.md`·`DESIGN.md` 기준으로 부품 조립. 캡처 확인, `check:ui`, REQ와 E2E까지 |
| `/slipway:resource` | 리소스의 데이터 층(테이블·마이그레이션·API·Mock·훅·테스트) 생성과 화면 연결 |
| `/slipway:deploy` | 정적·컨테이너·VPS·분리 배포 중 골라 준비하고, 확인을 받은 뒤 올림 |

### 2. 다른 AI 도구 (Codex, Cursor 등)

Slipway를 받은 폴더에서 "Slipway로 ○○ 앱 만들어 줘"라고 합니다. 루트 `AGENTS.md`에 같은 흐름(먼저 묻기 → 옆 폴더에 생성 →
데이터 층 → 화면 조립 → 검증)이 있고, 만들어진 프로젝트에서는 그 프로젝트의 `AGENTS.md`를 따릅니다.

### 3. 직접

```sh
node scripts/create-project.mjs ../my-app --name "주문 관리"          # --preset react·next·mono·nest·astro·flutter
cd ../my-app
corepack pnpm install --frozen-lockfile
corepack pnpm gen resource orders 주문 --fields "title:text:주문명 amount:won:금액"
corepack pnpm dev
```

화면은 `src/patterns/`의 부품으로 만들고(`CODEPACK.md`), `pnpm shots`로 캡처를 보고, `pnpm verify`로 검증합니다.
Node.js 22.23.4 이상, pnpm 10.33.2가 필요합니다.

## 리소스 생성

```sh
corepack pnpm gen resource orders 주문 \
  --fields "title:text:주문명 customer:text:고객 amount:won:금액 status:enum(접수|배송중|완료):상태 dueAt?:date:납기"
```

필드 타입은 `text` `textarea` `email` `phone` `number` `won` `date` `enum(a|b)`이고, 이름 뒤 `?`는 선택 입력입니다.
프리셋에 있는 층만 만들고, 화면은 만들지 않습니다. 화면과 디자인은 `src/patterns/` 부품으로 직접(또는 AI가) 조립합니다.

| 층 | 만들어지는 것 |
|---|---|
| 스키마 | zod 규칙 한 벌. mono는 `packages/shared`에 두고 웹과 API가 같이 씁니다 |
| DB·API | Drizzle 테이블과 마이그레이션, 로그인한 사용자 데이터만 다루는 CRUD, 계약 테스트 |
| 웹 | 조회·저장·삭제 훅(TanStack Query), Mock 핸들러, Mock과 실제 API에 같은 요청을 보내는 계약 테스트 |

## 품질 관문

생성한 프로젝트의 `pnpm verify`와 GitHub Actions(`.github/workflows/verify.yml`)가 돌립니다. 검사를 통과하지 못하면 실패합니다.

| 관문 | 명령 | 기준 |
|---|---|---|
| 디자인 | `pnpm check:ui` | 모든 라우트 × 데스크톱·모바일 × 라이트·다크. axe(WCAG 2.1 AA, 대비 포함), 가로 넘침, 클릭 요소의 포인터 커서, Tab 포커스 표시, 콘솔 오류 |
| 화면 확인 | `pnpm shots` | 같은 조합의 캡처를 `.shots/`에 저장. AI가 직접 보고 고칩니다 |
| 성능 | `pnpm check:bundle` | 첫 화면 JS 200KB·CSS 60KB, 지연 로드 파일 250KB(gzip) |
| 웹 점수 | `pnpm check:score` | Lighthouse 성능 90, 접근성·권장 사항·SEO 95. 크롬이 필요해 CI에서 잽니다 |
| 보안 | `pnpm verify`, `pnpm audit:deps` | CSP·보안 헤더, 로그인 요청 제한, 운영 모드에서 데모 계정·게스트 꺼짐, 의존성 취약점 |

디자인 기준은 프로젝트의 `DESIGN.md`(토큰·타이포·레이아웃·부품 규칙)와 `PRODUCT.md`(사용자·목적·톤)입니다.
웹 화면 작업에는 [Impeccable](https://impeccable.style) 스킬을, 모바일 소비자 앱의 초안에는 [k-style-ui-ux](https://github.com/vmc-inner-circle/k-style-ui-ux)를 권합니다.
보안 범위와 공개 전 점검표는 [보안](docs/security.md)에 있습니다.

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
| `next` | Next.js 16 App Router · 같은 부품 23개·Mock·API 클라이언트 · 요청마다 CSP nonce. SSR·SEO가 필요한 앱 |
| `mono` | 웹 + NestJS API + 공통 zod 스키마 패키지, Turborepo |
| `nest` | NestJS 12 · Drizzle · PGlite 또는 Postgres · 이메일·게스트·카카오·네이버 인증 |
| `flutter` | Flutter 웹뷰 셸. Slipway 웹 앱을 Android·iOS 앱으로: 뒤로 가기, 진행 표시, 오프라인 화면, 외부 링크, 파일 업로드, `window.SlipwayApp` 브리지(공유·진동) |
| `astro` | Astro 7 · 같은 테마 토큰 · SEO(canonical·Open Graph·sitemap·robots) · 해시 CSP · React 아일랜드. 소개·랜딩·문서 사이트 |

## 문서

- [부품 사용법](docs/codepack.md): 부품 규약, 로그인·앱 틀 조립, 조합 예시
- [개발·검증 기준](docs/feature-workflow.md): 요청 하나를 요구사항부터 E2E까지 끝내는 순서
- [배포](docs/deploy.md): 정적 호스팅, 컨테이너, VPS 한 대
- [보안](docs/security.md): 기본으로 막는 것, 공개 전 점검표
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
