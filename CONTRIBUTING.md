# Slipway 고치기

Slipway 자체(템플릿, 부품, 생성기, 플러그인)를 바꾸는 사람을 위한 안내입니다. Slipway로 앱을 만드는 방법은 [README](README.md)에 있습니다.
AI 도구로 작업할 때의 규칙은 [AGENTS.md](AGENTS.md)에 같은 내용이 있습니다.

## 템플릿끼리의 관계

프리셋 여섯 개 중 두 개만 직접 고치는 원본입니다. 나머지 둘은 원본에서 만들어지고, 둘은 따로 관리합니다.

```
templates/react ──┬─ scripts/sync-mono.mjs ─→ templates/mono/apps/web       (전부 복사 후 mono용으로 수정)
                  └─ scripts/sync-next.mjs ─→ templates/next/src/…           (부품·shadcn·Mock·API 클라이언트·테마만)
templates/nest  ──── scripts/sync-mono.mjs ─→ templates/mono/apps/api       (전부 복사 후 mono용으로 수정)
                                              templates/mono/packages/shared (kr.ts, auth 계약)

templates/astro, templates/flutter            따로 관리
```

- `templates/mono/apps/*`와 `templates/next`의 복사된 파일은 손으로 고치지 않습니다. 다음 동기화 때 덮어써집니다.
  원본을 고치고 `pnpm sync`를 돌립니다.
- 손으로 고치는 파일:
  - mono: 루트 `package.json`·`turbo.json`·`AGENTS.md`·`Dockerfile`·`Dockerfile.api`·`compose.yaml`, `packages/shared`의 `package.json`·`tsconfig.json`
  - next: `src/app/`, `src/proxy.ts`, `src/config.ts`, `src/patterns/app-shell.tsx`, `scripts/ui.mjs`·`check-bundle.mjs`, 설정 파일, `e2e/`
- 동기화 스크립트는 바꿀 위치를 문자열로 찾고, 못 찾으면 멈춥니다. 원본의 해당 줄을 바꿨다면 스크립트의 기준 문자열도 같이 바꿉니다.

## 무엇을 바꾸려면 어디를

| 바꾸려는 것 | 고칠 곳 | 그다음 |
|---|---|---|
| 부품 하나 | `templates/react/src/patterns/` | `codepack/catalog.json`의 규약, `fixtures/parts/`와 `parts-tests/`, `docs/codepack.md`, `pnpm sync` |
| 새 부품 | 위와 같고, `parts-tests/a11y.parts.ts`의 목록에도 추가 | `pnpm pack:check`가 export와 의존 파일을 확인 |
| 테마 토큰(기술 기본값) | `templates/react/src/index.css` | `pnpm sync`(next·mono에 복사), astro의 `src/styles/global.css`는 직접. 디자인 기준·예시 화면은 넣지 않습니다(디자인은 각 프로젝트의 하네스가 정함) |
| 인증·API 규칙 | `templates/nest/src/` | 계약 테스트 `test/`, 웹 Mock(`templates/react/src/mocks/`)도 같은 규칙으로 |
| 로고 연결 | `scripts/brand.mjs` | `tests/brand.test.mjs` |
| 리소스 생성기 | `scripts/gen.mjs` | `tests/gen.test.mjs`, 그리고 실제 프로젝트에 생성해서 `pnpm verify`(아래) |
| 새 프로젝트에 들어가는 문서·README | `docs/*.md`, `scripts/create-project.mjs` | `tests/create-project.test.mjs` |
| 검사 기준(접근성·번들·점수) | `templates/react/scripts/ui-checks.mjs`·`check-bundle.mjs`·`lighthouserc.cjs` | `pnpm sync`, next·astro의 대응 파일 |
| 플러그인 명령 | `plugin/skills/*/SKILL.md` | `claude plugin validate .` |

## 처음 준비

Node.js 22.23.4 이상, pnpm 10.33.2(`corepack enable`)가 필요합니다.

```sh
corepack pnpm run bootstrap   # 템플릿 다섯 개 의존성 설치 + Playwright Firefox
```

flutter 템플릿을 고친다면 Flutter SDK(stable)와 Android SDK도 필요합니다.

## 검증

| 명령 | 확인하는 것 | 시간 |
|---|---|---|
| `corepack pnpm test` | 생성기, 프로젝트 생성, 요구사항 검사기, 부품 복사. 의존성 설치 없이 돔 | 수 초 |
| `corepack pnpm pack:check` | 부품 카탈로그의 규약, export, 의존 파일 | 수 초 |
| `corepack pnpm verify` | 위 둘 + react(앱·부품 테스트), nest, mono, next, astro 템플릿 각각의 `verify` | 15분 안팎 |
| `corepack pnpm verify:flutter` | Flutter 분석과 단위 테스트 | 1분 안팎 |

생성기를 바꿨다면 실제 프로젝트로도 확인합니다. 템플릿 검증만으로는 생성된 코드가 컴파일되는지 알 수 없습니다.

```sh
node scripts/create-project.mjs /tmp/check-app --preset mono
cd /tmp/check-app && corepack pnpm install --frozen-lockfile
corepack pnpm gen resource orders 주문 --fields "title:text:주문명 amount:won:금액 status:enum(접수|완료):상태 dueAt?:date:납기"
corepack pnpm verify
```

WSL에서는 헤드리스 Chromium이 화면을 그리지 못해 브라우저 테스트가 모두 Firefox로 돕니다. Lighthouse(`check:score`)는 크롬이 필요해 로컬 WSL에서는 돌지 않고, 만들어진 프로젝트의 CI에서 잽니다.

## 커밋

- 메시지는 Conventional Commits에 한국어 설명: `feat: …`, `fix: …`, `docs: …`
- 원본을 고쳤다면 `pnpm sync`로 바뀐 mono·next 파일을 같은 커밋에 넣습니다.
- 대표 그림을 바꿨다면 원본 `docs/images/banner.html`을 고치고 `banner.png`를 다시 찍습니다(1280×640, 2배).
