---
name: new
description: Slipway로 새 앱이나 사이트를 만든다. 프리셋(react·next·mono·nest·astro·flutter), 디자인 하네스(Impeccable·k-style), 배포 대상을 먼저 묻고 프로젝트 생성, 리소스 데이터 층(DB·API·Mock), 부품으로 기능 조립, 하네스로 디자인, 검증까지 진행한다. 사용자가 "Slipway로 앱 만들어줘", "해커톤용으로 하나 띄워줘", PRD·기획서를 주며 앱을 만들라고 할 때 트리거.
---

# slipway:new

요구사항을 받아 Slipway 프로젝트를 만들고, 데이터 층은 생성기로, 화면은 부품으로 조립해 검증까지 끝낸다.
Slipway는 화면도 디자인 기준도 주지 않는다. 기능은 부품으로 조립하고, 모양은 디자인 하네스가 사용자와 함께 정한다.
이 스킬을 쓰는 AI가 자기 취향으로 스타일을 정하지 않는다.

## 1. 먼저 묻는다

만들기 전에 한 번에 묻는다(Claude Code는 AskUserQuestion 하나에 질문 여러 개). 사용자가 이미 답한 항목은 묻지 않는다.

1. **무엇을 만드는가**: 한 줄 설명이나 PRD. 없으면 "어떤 앱인지 한두 줄로 알려 주세요"를 먼저 묻는다.
2. **프리셋**
   - `react`(추천: 빠른 시연): 서버 없이 브라우저 Mock으로 바로 동작
   - `next`: React 대신 Next.js App Router. SSR·SEO가 필요하거나 Vercel 위주일 때
   - `mono`: 웹 + NestJS API + DB. 실제 저장·로그인이 필요할 때
   - `nest`: API만
   - `astro`: 소개·랜딩·문서 같은 정적 사이트. 리소스 생성기 없음
   - `flutter`: 만든 웹 앱을 Android·iOS 앱으로 감싸는 셸. 웹 앱 프리셋과 함께 만든다
3. **디자인 하네스**
   - Impeccable(웹 화면, 기본). 사용자와 `PRODUCT.md`·`DESIGN.md`를 만들고 화면을 짓고 비평·다듬기까지 한다
   - k-style-ui-ux 초안 먼저: 소비자용 모바일 앱처럼 흐름과 미감이 중요할 때. 이후 웹 화면은 Impeccable로
4. **배포**: 나중에(추천) / 정적 호스팅(Vercel·Cloudflare·Netlify) / 컨테이너(Railway·Fly.io·AWS·Cloud Run) / VPS 한 대(iwinv·EC2)

## 2. Slipway 소스 준비

- 지금 폴더가 Slipway 저장소(`scripts/create-project.mjs`가 있음)라면 그대로 쓴다.
- 아니면 캐시에 받는다: `git clone --depth 1 https://github.com/wooinwoo/slipway ~/.cache/slipway`
  (이미 있으면 `git -C ~/.cache/slipway pull --ff-only`).

## 3. 프로젝트 생성

Slipway 저장소 안이나 `templates/`에는 만들지 않는다. 사용자의 현재 작업 폴더(Slipway 저장소라면 그 옆)에 만든다.

```sh
node <slipway>/scripts/create-project.mjs <폴더> --preset <프리셋> --name "<서비스 이름>" --tagline "<한 줄 소개>"
cd <폴더> && corepack pnpm install --frozen-lockfile
```

폴더 이름은 영문 소문자·숫자·하이픈. 이후 작업은 그 폴더의 `AGENTS.md`를 따른다.

## 4. 디자인 하네스

- 로고와 브랜드 색이 이미 있는지 먼저 묻는다. 있으면 그대로 쓴다. 없으면 AI가 정해서 적어 넣지 않는다:
  하네스가 근거와 함께 방향을 제안하고 사용자가 고른다. 로고 파일이 생기기 전까지는 이름을 글자로만 쓴다(도형 속 첫 글자 같은 가짜 마크 금지).
  파일을 받으면 `corepack pnpm brand <파일>`로 연결한다.
- Impeccable이 설치돼 있지 않으면 설치를 권한다(https://impeccable.style). 설치 전에는 스타일을 지어내지 않는다.
- 설치돼 있으면 프로젝트에서 `/impeccable init`으로 사용자와 `PRODUCT.md`(누가·왜·톤)를, 첫 화면 전에 `DESIGN.md`(시각 방향·토큰)를
  만든다. 토큰은 하네스가 `src/index.css`에 반영한다.
- k-style-ui-ux를 골랐다면 PRD로 `/k-style-ui-ux:go <PRD 파일>`을 실행하고(없으면 설치 명령을 안내), 결과 `out/index.html`의
  흐름과 화면 목록을 요구사항으로 옮긴다. HTML은 복사하지 않는다.
  ```
  /plugin marketplace add vmc-inner-circle/k-style-ui-ux
  /plugin install k-style-ui-ux@k-style-ui-ux
  ```

## 5. 조립 (react·mono)

1. 요구사항에서 사용자가 만들고 고치는 대상(리소스)과 필드를 뽑는다. 필수 필드는 하나 이상.
2. 리소스마다 데이터 층을 생성한다(스키마, 테이블·마이그레이션, API, Mock, 조회·저장 훅, 계약 테스트).
   ```sh
   corepack pnpm gen resource orders 주문 --fields "title:text:주문명 amount:won:금액 status:enum(접수|배송중|완료):상태 dueAt?:date:납기 memo?:textarea:메모"
   ```
   타입: text, textarea, email, phone, number, won, date, enum(a|b). 이름 뒤 `?`는 선택 입력.
3. 화면은 screen 스킬(`/slipway:screen`, 프로젝트의 `.claude/skills/screen`) 순서로 하나씩 만든다. 기능은 부품과 훅으로 조립하고
   (인증 연결은 `CODEPACK.md`), 모양은 디자인 하네스가 정한다. 요구사항마다 `docs/requirements.md`에 `REQ-n`을 추가한다.
4. `src/config.ts`의 이름·소개를 맞춘다.

nest 프리셋도 `corepack pnpm gen resource ...`로 테이블·마이그레이션·API·계약 테스트를 만든다.

## 6. 검증

```sh
corepack pnpm verify                # 타입·린트·테스트·요구사항·번들 예산·E2E·UI 검사(접근성·대비·넘침·커서·포커스)
corepack pnpm shots / /<리소스>     # react·mono 웹. .shots/의 캡처를 직접 열어 본다
```

웹 점수(Lighthouse)는 CI(`.github/workflows/verify.yml`)가 잰다. 크롬이 되는 환경이면 `pnpm check:score`로 직접 잰다.
실패하면 원인을 고친다. 검사를 약하게 바꾸지 않는다. 캡처를 보기 전에는 화면 품질을 보고하지 않는다.
사용자에게 주소를 넘기기 전에 그 주소·모드 그대로 열어 로그인과 주 흐름을 직접 눌러 본다. Mock 모드는 https나 localhost에서만 동작한다(서비스 워커).

## 7. 배포 (골랐을 때만)

deploy 스킬(`/slipway:deploy`, 프로젝트의 `.claude/skills/deploy`)의 순서를 따른다.

## 끝낼 때

만든 폴더, 실행 명령(`corepack pnpm dev`), 만든 리소스와 화면, 검증 결과, 남은 일을 짧게 알린다.
