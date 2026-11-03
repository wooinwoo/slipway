# Slipway

해커톤·사내 POC용 코드팩. 필요한 코드를 골라 복사하고, 만들려는 데모에 맞게 수정합니다.

## 부품 가져오기

저장소 루트에서 실행합니다. Node.js 22.23.4 이상이 필요합니다.

```sh
node scripts/pack.mjs list
node scripts/pack.mjs show table form
node scripts/pack.mjs copy table form --to ../my-poc/src
```

- `list`: 부품 목록
- `show`: 사용법, 수정 지점, 의존 파일과 패키지
- `copy`: 선택한 부품과 필요한 파일 복사. 기존 파일과 충돌하면 중단

UI 부품은 React + TypeScript + Tailwind CSS 4 기준입니다. 복사 후에는 출력된 패키지를 설치하고,
`@/`를 대상 프로젝트의 `src/`에 연결합니다. 전역 CSS 진입점에 테마를 한 번 불러옵니다.

```ts
import "./styles/slipway.css"
```

복사한 코드는 직접 수정해서 씁니다. 가져온 파일과 패키지 목록은 `src/slipway-parts.json`에 남습니다.

## 들어 있는 것

| ID | 용도 |
|---|---|
| `table` | 표, 검색 입력, 페이지 이동 |
| `advanced-table` | 정렬, 페이지별 선택, 비동기 일괄 처리 |
| `filters` | 검색·선택·다중 선택·숫자·날짜 범위 필터 |
| `chart` | 막대·선·영역 차트, 원본 데이터 표 |
| `wizard` | 단계형 폼, 단계별 검증과 입력 보존 |
| `date-range` | 날짜 범위와 기간 프리셋 |
| `timeline` | 진행 기록과 액션 슬롯 |
| `csv` | CSV 검증·미리보기·가져오기·다운로드 |
| `csv-utils` | UI 없이 쓰는 CSV 파싱·직렬화 |
| `form` | 필드 설정으로 만드는 폼, 입력 오류와 제출 상태 |
| `details` | 상세 슬라이드 패널과 액션 슬롯 |
| `board` | 상태별 보드, 상태 변경 콜백 |
| `metrics` | 지표 카드 |
| `files` | 파일 선택·드롭, 형식·크기·개수 검사 |
| `async-state` | 로딩·오류·빈 결과·재시도 |
| `confirm` | 비동기 확인·취소, 실패 후 재시도 |
| `kr-inputs` | 전화번호·사업자번호·금액·주소 입력 |
| `kr-format` | 한국어 숫자·날짜·연락처 포맷과 검증 |
| `api-client` | JSON 요청, 필드 오류, 토큰 처리 |
| `theme` | 브랜드 색, 라이트·다크, 타이포그래피 |

입력값과 콜백 규약은 [부품 사용법](docs/codepack.md)에 정리돼 있습니다.
원본 코드는 `templates/react/src/`, 목록 정의는 [`codepack/catalog.json`](codepack/catalog.json)에 있습니다.
명령에 `--json`을 붙이면 목록과 규약을 도구에서도 읽을 수 있습니다.

## 프로젝트 기반도 필요하면

```sh
node scripts/create-project.mjs ../my-poc --name "프로젝트 이름"
cd ../my-poc
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

기본은 React + Mock API입니다. `--preset mono`는 웹·API·공통 패키지, `--preset nest`는 API 기반을 생성합니다.

## 코드팩 수정하기

부품의 입력·출력과 의존성은 카탈로그에 등록합니다. 동작 테스트는 기본 앱과 분리된 `fixtures/parts/`에서 실행합니다.
검증에는 PATH에 등록된 pnpm 10.33.2가 필요합니다.

```sh
node scripts/pack.mjs check
corepack pnpm --dir templates/mono install --frozen-lockfile
corepack pnpm --dir templates/mono --filter @slipway/web exec playwright install firefox
corepack pnpm verify
```

[개발·검증 기준](docs/feature-workflow.md) · [부품 사용법](docs/codepack.md)
