# 보안

Slipway가 기본으로 막는 것과 공개 전에 직접 정해야 하는 것입니다.

## 기본으로 들어 있는 것

| 항목 | 내용 | 위치 |
|---|---|---|
| 비밀번호 | scrypt 해시, 8자 이상. 틀리면 이메일·비밀번호 중 무엇이 틀렸는지 알리지 않음 | `src/common/crypto.ts`, `src/auth/` |
| 세션 | 32바이트 무작위 토큰. 서버에는 SHA-256 해시만 저장, 만료(`SESSION_DAYS`)와 로그아웃 시 폐기 | `src/auth/auth.service.ts` |
| 소셜 로그인 | state 쿠키(httpOnly, 10분)로 콜백 위조 차단. 토큰은 URL 조각(#)으로 넘겨 서버 로그에 남지 않음. 이메일이 같아도 계정을 자동으로 합치지 않음 | `src/auth/auth.controller.ts` |
| 데이터 소유 | 생성된 리소스 API는 모든 조회·수정·삭제를 로그인한 사용자 기준으로 거름. 다른 사용자의 데이터는 404 | `pnpm gen resource` 출력, 계약 테스트 |
| 입력 검증 | 모든 요청 본문을 웹과 같은 zod 스키마로 검사, 필드별 오류 반환. JSON 본문 100KB 제한(Express 기본값) | `parse()` |
| 요청 제한 | IP당 분당: 로그인·가입·게스트 `AUTH_RATE_LIMIT`(20), 나머지 `RATE_LIMIT`(300). 초과 시 429 | `app.module.ts` |
| 보안 헤더 | CSP(`unsafe-eval` 없음), `frame-ancestors 'none'`, `nosniff`, HSTS, Referrer-Policy. 정적 호스팅은 `vercel.json`·`public/_headers` | `src/setup.ts` |
| 운영 모드 | `NODE_ENV=production`이면 데모 계정·게스트 로그인 기본 꺼짐, `WEB_URL`·`API_URL` 없으면 시작 거부, 프록시 1단 신뢰 | `src/config.ts` |
| CORS | `WEB_URL`에 적은 주소만 허용 | `src/setup.ts` |

`test/security.e2e-spec.ts`가 헤더, 요청 제한, 운영 모드 기본값을 확인합니다.

## 공개 전에 정할 것

- [ ] `DEMO=false`, `ALLOW_GUEST=false`(공개 시연이라면 켜 두되 데이터가 공개된다고 가정)
- [ ] `DATABASE_URL`을 관리형 Postgres로. 컨테이너 안 PGlite는 교체 시 사라짐
- [ ] HTTPS. 호스트가 주지 않으면 Caddy·Nginx를 앞에 둠
- [ ] `TRUST_PROXY`를 실제 프록시 단수에 맞춤(직접 연결이면 0). 틀리면 요청 제한이 엉뚱한 IP를 셈
- [ ] 웹을 따로 올렸다면 `public/_headers`·`vercel.json`의 `connect-src`를 API 주소로 좁힘
- [ ] `pnpm audit:deps`로 의존성 취약점 확인(높음 이상이면 실패)
- [ ] 비밀 값은 `.env`나 호스트 환경 변수에만. `.env`는 git에서 제외돼 있음

## 들어 있지 않은 것

제품마다 요구가 달라 기본값을 두지 않았습니다. 필요하면 추가합니다.

- 이메일 소유 확인, 비밀번호 재설정, 2단계 인증
- 역할·권한(관리자, 조직, 공유). 생성된 API는 "본인 것만"이 기준
- 감사 로그, 개인정보 보관 기간과 파기
- 토큰은 브라우저 localStorage에 둡니다. CSP로 스크립트 주입을 막는 것이 전제입니다. httpOnly 쿠키 세션이 필요하면 인증 방식을 바꿔야 합니다.
