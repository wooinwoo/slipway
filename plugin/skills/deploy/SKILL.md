---
name: deploy
description: Slipway 프로젝트를 배포한다. 정적 호스팅(Vercel·Cloudflare·Netlify·S3), 컨테이너(Railway·Fly.io·Render·AWS·Cloud Run), VPS 한 대(iwinv·EC2, docker compose), 웹·API 분리 배포를 고른다. "배포해줘", "링크 뽑아줘", "서버에 올려줘"에 트리거.
---

# slipway:deploy

프로젝트의 `DEPLOY.md`가 기준이다. 먼저 읽는다.

## 1. 묻기

정해지지 않았으면 한 번에 묻는다.

- **형태**: 한 주소(웹+API 한 이미지) / 웹·API 따로 / 정적 시연(react Mock)
- **올릴 곳**: 이미 계정이 있는 곳. 없으면 정적은 Vercel, 컨테이너는 Railway, 서버 한 대는 docker compose를 추천한다.
- **DB**: 호스트가 주는 Postgres / Neon·Supabase / VPS의 compose Postgres / 시연이라 내장 PGlite

## 2. 준비

| 형태 | 파일 |
|---|---|
| 정적 (react, 또는 mono의 웹) | `vercel.json`, `public/_redirects`. 빌드 `pnpm build`(mono는 `pnpm build:web`), 출력 `dist`(mono는 `apps/web/dist`) |
| 한 이미지 (mono) | `Dockerfile` |
| API만 (mono) | `Dockerfile.api` |
| API만 (nest) | `Dockerfile` |
| VPS 한 대 (mono) | `compose.yaml` |

환경 변수: `DATABASE_URL`, `WEB_URL`, `API_URL`(OAuth 콜백 `${API_URL}/api/auth/<kakao|naver>/callback`), 공개 서비스라면 `DEMO=false`, `ALLOW_GUEST=false`.
웹을 따로 올리면 빌드 환경 변수 `VITE_API_URL`에 API 주소를 넣고, API의 `WEB_URL`에 웹 주소를 넣는다.

## 3. 올리기

- 호스트 CLI(`vercel`, `railway`, `fly`, `wrangler`, `aws`)가 설치·로그인돼 있으면 명령을 보여 주고 실행해도 되는지 확인한 뒤 실행한다.
  외부에 공개되는 작업이므로 확인 없이 배포하지 않는다.
- CLI가 없으면 대시보드에서 넣을 값(저장소, 빌드 명령, 출력 폴더, Dockerfile 경로, 환경 변수)을 표로 정리해 준다.
- VPS는 서버에서 `PUBLIC_URL=http://<주소> docker compose up -d --build`. HTTPS는 Caddy·Nginx나 로드 밸런서로 붙인다.

## 4. 확인

배포 주소에서 `/api/health`(API가 있을 때), 첫 화면, 새로고침한 하위 경로, 로그인이 되는지 확인하고 주소를 알려 준다.
