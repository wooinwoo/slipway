# Slipway

데모가 하루 안에 나오는 스타터. 로그인, 데이터, 화면, 검증이 처음부터 동작하고, 코드는 전부 내 것이라 바로 고칠 수 있습니다.

| 프리셋 | 용도 |
|---|---|
| `templates/react` | Vite + React. 서버 없이 브라우저 안의 가짜 API로 완성된 데모 |
| `templates/nest` | 그 가짜 API와 똑같은 계약의 실서버. 설치 없이 내장 Postgres(PGlite), `DATABASE_URL`이면 실 Postgres |
| `templates/mono` | react + nest + `packages/shared`(스키마·한국 입력·시드 한 벌). Turborepo |
| `templates/next` | 보류. 서버 렌더링이 꼭 필요할 때 |

세 프리셋이 같은 `/api/*` 계약을 씁니다. 데모로 시작해서 `VITE_API_URL`만 바꾸면 실서버로 넘어가고, 같은 E2E가 양쪽에서 돌아갑니다.

## react 프리셋에 들어 있는 것

- **화면**: shadcn 컴포넌트 63개 전부, 랜딩, 로그인·가입, 사이드바 앱 틀, 대시보드, 목록·상세·추가, 설정
- **데이터**: MSW 가짜 백엔드와 한국어 시드 46건. `VITE_API_URL`만 넣으면 같은 호출이 실서버로 갑니다
- **로그인**: 게스트 원클릭, 이메일, 카카오·네이버 버튼(데모에서는 샘플 계정으로 로그인)
- **한국 입력**: 전화번호 자동 하이픈, 사업자등록번호 국세청 검증, "1억 2,500만원" 금액 표기, 다음 주소 검색
- **브랜드**: `--brand-h` 숫자 하나로 전체 색이 바뀝니다. 설정 화면에서 실시간으로도 바꿉니다
- **하네스**: `AGENTS.md`, 요구사항 `REQ-n`이 화면 파일과 E2E 테스트에 모두 연결됐는지 검사, `pnpm verify` 한 줄 검증

```bash
cd templates/react
pnpm install
pnpm dev       # http://localhost:5173
pnpm verify    # 타입, 린트, 단위 테스트, 요구사항 연결, 빌드, E2E
```

## nest

```bash
cd templates/nest
pnpm install
pnpm dev       # http://localhost:3000/api  (PGlite, 시드 46건, 게스트 로그인)
pnpm verify    # 타입, 린트, 단위, API 계약 테스트 11개, 빌드
```

## mono

```bash
cd templates/mono
pnpm install
pnpm dev       # web :5173 → /api 프록시 → api :3000
pnpm dev:demo  # web만, 브라우저 가짜 API로
pnpm verify
```
