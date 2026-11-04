# 배포

어디든 올라가도록 두 가지 형태만 씁니다. 특정 클라우드 전용 설정은 없습니다.

| 형태 | 프리셋 | 올리는 곳 |
|---|---|---|
| 정적 사이트 | `react` (Mock 모드), 웹만 따로 | Vercel, Cloudflare Pages, Netlify, AWS S3 + CloudFront, Amplify |
| 컨테이너 이미지 | `mono` (웹 + API 한 이미지), `nest` | Railway, Fly.io, Render, AWS App Runner·ECS·Lightsail, Cloud Run, 아무 VPS |
| 웹·API 따로 | `mono` (웹은 정적, API는 `Dockerfile.api`), `react` + `nest` | 웹은 Vercel·Cloudflare 등, API는 컨테이너 호스트 |
| VPS 한 대 | `mono` + Postgres | iwinv, EC2, Lightsail 등 Docker가 있는 서버: `docker compose up -d --build` |

## 정적 사이트: react

서버 없이 브라우저 Mock으로 도는 시연 링크가 필요할 때입니다.

- 빌드 명령 `pnpm build`, 출력 폴더 `dist`
- 새로고침해도 화면이 뜨도록 모든 경로를 `index.html`로 보냅니다.
  - Vercel: `vercel.json`이 처리합니다.
  - Netlify: `public/_redirects`가 처리합니다.
  - Cloudflare Pages: 자동으로 처리합니다(`_redirects` 규칙은 무시되고 경고만 남습니다).
  - S3 + CloudFront: 403·404 오류 응답을 `/index.html`, 상태 200으로 지정합니다.
- 실제 API에 붙이려면 빌드 환경 변수 `VITE_API_URL`에 API 주소를 넣습니다. 빌드할 때 들어가므로 바꾸면 다시 빌드합니다.

## 컨테이너: mono

`Dockerfile` 하나로 웹을 빌드하고, API 서버가 같은 주소에서 웹 화면과 `/api`를 함께 냅니다. CORS 설정이 필요 없습니다.

```sh
docker build -t my-app .
docker run -p 3000:3000 -e DATABASE_URL=postgres://... -e WEB_URL=https://my-app.example.com -e API_URL=https://my-app.example.com my-app
```

컨테이너 호스트에서는 저장소를 연결하면 `Dockerfile`을 알아서 찾습니다. 환경 변수만 넣습니다.

| 변수 | 값 |
|---|---|
| `DATABASE_URL` | 호스트가 주는 Postgres 주소(Railway·Render Postgres, Neon, Supabase, RDS 등) |
| `WEB_URL`, `API_URL` | 배포된 공개 주소. 둘 다 같은 값 |
| `PORT` | 호스트가 정하면 그대로 둡니다(기본 3000) |
| `DEMO`, `ALLOW_GUEST` | 공개 서비스라면 `false` |
| `KAKAO_*`, `NAVER_*` | 소셜 로그인을 쓸 때. 콜백 주소는 `${API_URL}/api/auth/<kakao|naver>/callback` |

`DATABASE_URL`이 없으면 컨테이너 안의 PGlite(`/app/apps/api/.data`)에 저장합니다. 시연용이라면 그대로 써도 되지만,
컨테이너를 다시 만들면 데이터가 사라지므로 볼륨을 붙이거나 Postgres를 연결합니다. 마이그레이션은 서버가 시작할 때 적용합니다.

## VPS 한 대: mono + Postgres

```sh
git clone <내 저장소> && cd <폴더>
PUBLIC_URL=http://<서버 주소> docker compose up -d --build
```

`compose.yaml`이 앱과 Postgres를 함께 띄웁니다. 앱은 80번 포트(`APP_PORT`로 변경), DB는 외부에 열지 않습니다.
`POSTGRES_PASSWORD`를 바꾸고, HTTPS는 서버 앞단(Caddy, Nginx, 클라우드 로드 밸런서)에서 붙입니다.

## 웹과 API를 따로 올릴 때

웹은 정적 호스팅에, API는 컨테이너 호스트에 올립니다. 토큰은 `Authorization` 헤더로 보내므로 쿠키 도메인 설정이 필요 없습니다.

**API (mono)**: 저장소 루트에서 `Dockerfile.api`로 빌드합니다.

```sh
docker build -f Dockerfile.api -t my-app-api .
```

Railway·Render·Fly.io에서는 Dockerfile 경로를 `Dockerfile.api`로 지정합니다.

| 변수 | 값 |
|---|---|
| `WEB_URL` | 웹 주소. CORS 허용과 OAuth 복귀 주소로 씁니다. 여러 개면 쉼표로 구분 |
| `API_URL` | 이 API의 공개 주소 |
| `DATABASE_URL` | Postgres 주소 |

**웹 (mono)**: 정적 호스팅에 저장소를 연결합니다.

| 항목 | 값 |
|---|---|
| 루트 디렉터리 | 저장소 루트 |
| 빌드 명령 | `pnpm build:web` |
| 출력 폴더 | `apps/web/dist` |
| 환경 변수 | `VITE_API_URL=https://api.example.com` |

Vercel은 루트 디렉터리를 `apps/web`으로 두어도 됩니다. 그때는 빌드 명령 `cd ../.. && pnpm build:web`, 출력 폴더 `dist`이고,
`apps/web/vercel.json`이 새로고침 경로를 처리합니다.

**react + nest 프리셋**: 각각 별도 저장소로 만들고 react는 정적 사이트, nest는 그 `Dockerfile`로 올립니다. 환경 변수는 위와 같습니다.
