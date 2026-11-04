# Slipway 코드팩

필요한 패턴을 가져와 자신의 데이터와 콜백을 연결합니다. 기본 앱에 특정 업무 화면,
메뉴, 도메인 API, 샘플 테이블을 자동으로 붙이지 않습니다.

## 찾기·확인·선택 복사

다음 명령은 Slipway 저장소 루트에서 실행합니다. Node.js만 있으면 됩니다.

```sh
node scripts/pack.mjs list
node scripts/pack.mjs show table form
node scripts/pack.mjs copy table form --to ../my-poc/src
```

`show`는 입력·출력·수정 지점·제약과 의존 파일·패키지를 보여 줍니다. `--json`을 붙이면
AI 작업 도구에서도 읽을 수 있습니다. 목록의 원본은 `codepack/catalog.json`입니다.

`copy`는 선택한 부품과 그 부품이 import하는 파일만 복사합니다. 필요한 공통 테마는
`styles/slipway.css`로 복사하며, 기존 `index.css`와 `package.json`은 수정하지 않습니다.
같은 파일은 유지하고 내용이 다른 기존 파일이 있으면 복사 전에 중단합니다.
대상에는 선택 이력·파일·패키지를 담은 `slipway-parts.json`이 남습니다.

패키지는 출력된 버전을 참고해 대상 프로젝트에서 설치합니다. `@/*`가 대상 src를 가리키도록
설정하고, 스타일이 필요한 부품은 전역 진입점에서 `./styles/slipway.css`를 한 번 import합니다.
테마는 Tailwind CSS 4 환경을 사용합니다. 라우트·메뉴·데이터·서버는 자동 등록하지 않습니다.

새 프로젝트 생성기를 사용한 React/mono 템플릿에는 부품 소스가 이미 들어 있습니다.
그때는 바로 import하면 됩니다. Nest 프리셋은 서버 기반이며 웹 부품을 포함하지 않습니다.

## 제공하는 부품

| 파일 | 입력 | 역할 |
|---|---|---|
| `src/patterns/data-table.tsx` | 행, 열 렌더 함수, 선택 콜백 | 표, 빈 결과, 로컬 페이지 이동, 독립 검색 입력 |
| `src/patterns/advanced-table.tsx` | 행, 정렬할 열, 선택 ID, 일괄 처리 콜백 | 정렬, 페이지별 선택, 비동기 일괄 처리 |
| `src/patterns/filter-bar.tsx` | 필터 필드, 값, 변경 콜백 | 검색·선택·다중 선택·숫자·날짜 범위 |
| `src/patterns/chart-panel.tsx` | 행, X축 키, 계열, 종류 | 막대·선·영역 차트와 원본 데이터 표 |
| `src/patterns/step-form.tsx` | 초기값, 단계별 render·validate, 제출 | 단계별 검증, 입력 보존, 서버 오류 단계 이동 |
| `src/patterns/date-range.tsx` | 날짜 범위, 변경 콜백, 프리셋 | 시작·종료일 검증과 기간 선택 |
| `src/patterns/timeline.tsx` | 기록 목록, 상태, 액션 슬롯 | 완료·진행·예정 기록 |
| `src/patterns/csv-transfer.tsx` | 가져오기 콜백 / 내보낼 행·열 | 검증·미리보기·재시도·다운로드 |
| `src/lib/csv.ts` | CSV 문자열 / 열 정의와 행 | UI 없는 CSV 파싱·직렬화 |
| `src/patterns/record-form.tsx` | 초기값, 필드 설정, 저장 콜백 | 입력·선택·메모·사용자 정의 필드, 제출 상태와 오류 |
| `src/patterns/detail-panel.tsx` | 제목, 설명, 라벨·값, 액션 슬롯 | 상세 슬라이드 패널 |
| `src/patterns/status-board.tsx` | 행, 그룹, 카드 렌더, 이동 콜백 | 상태별 보드와 키보드로 조작하는 상태 변경 |
| `src/patterns/metric-grid.tsx` | 지표 라벨·값·설명·아이콘 | 반응형 지표 카드 |
| `src/patterns/file-drop.tsx` | File 목록·onChange·형식·크기 제한 | 파일 선택·드롭·개수 검사·제거 |
| `src/patterns/async-state.tsx` | pending·error·empty·retry·children | 로딩·오류·빈 상태·콘텐츠 |
| `src/patterns/confirm-action.tsx` | 트리거·문구·비동기 콜백 | 확인·취소·실행 중 상태·실패 재시도 |
| `src/components/kr-inputs.tsx` | value·onChange | 전화·사업자번호·금액·주소 입력 |
| `src/lib/kr.ts` | 문자열·숫자·날짜 | 한국어 포맷과 검증 |
| `src/api/client.ts` | 경로·JSON·RequestInit | JSON 응답·필드 오류·bearer 토큰 |
| `src/patterns/auth-forms.tsx` | submit·onSelect·onClick 콜백 | 로그인 카드, 이메일 로그인·가입 폼, 카카오·네이버·게스트 버튼 |
| `src/patterns/app-shell.tsx` | brand·nav·user·onLogout·children | 사이드바, 브레드크럼, Ctrl/⌘+K, 사용자 메뉴 |
| `src/patterns/theme-settings.tsx` | defaultHue | 라이트·다크·시스템, 브랜드 색 |
| `src/index.css` | 브랜드 hue·dark 클래스 | 공통 테마, 별도 파일로 선택 복사 |

모노레포에서는 같은 파일이 `apps/web/src/patterns/`에 있습니다. 각 부품은 다른 부품이나
업무 API를 자동으로 연결하지 않습니다. UI 기초 컴포넌트와 공통 테마만 사용합니다.

## 인증 연결

부품은 화면을 정하지 않습니다. 로그인 화면과 로그인 뒤 영역을 어떻게 구성할지는 프로젝트에서 디자인 하네스와 함께 정하고,
연결에 필요한 사실만 여기에 적습니다.

- 로그인·가입·게스트·소셜 요청은 `src/api/auth.ts`의 `useLogin`·`useSignup`·`useGuestLogin`·`useSocialLogin`이 보내고,
  토큰 저장과 `meQuery` 캐시를 처리합니다. `auth-forms`의 `submit`에는 이 훅의 `mutateAsync`를 연결하고,
  실패는 `ApiError`의 `message`·`fields`를 `AuthFailure`로 돌려줍니다.
- 어떤 로그인 방식을 둘지는 제품이 정합니다. 소셜·게스트 버튼은 필요할 때만 씁니다.
- 실제 API의 카카오·네이버는 `${BASE_URL}/api/auth/<provider>`로 이동했다가 `/auth/callback`으로 돌아옵니다. Mock(`isDemo`)은 바로 로그인합니다.
- 로그인이 필요한 라우트는 레이아웃 라우트의 `beforeLoad`에서 `context.queryClient.ensureQueryData(meQuery)`로 확인하고,
  사용자가 없으면 `token.clear()` 후 로그인 라우트로 `redirect`합니다. 반환한 `{ user }`는 `Route.useRouteContext()`로 읽습니다.
- `app-shell`의 브레드크럼과 탭 제목은 각 라우트의 `staticData.title`에서 옵니다(next는 `metadata.title`).

## 표의 연결 규약

`DataTable<T>`의 행 타입은 `id: string`을 포함하면 됩니다.
`columns`는 `{ key, title, render(row) }[]`, `onOpen`은 사용자가 첫 열을 선택했을 때의 콜백입니다.
표는 데이터를 변경하거나 API를 호출하지 않습니다. `pageSize`는 기본 6입니다.
검색 입력은 별도 `SearchInput`이며 필터링 방식은 호출하는 쪽에서 정합니다.
현재 페이지 이동은 작은 POC 데이터셋을 위한 로컬 처리입니다.

```tsx
<DataTable rows={rows} onOpen={open} columns={[
  { key: "title", title: "제목", render: row => row.title },
]} />
```

## 정렬·선택·일괄 처리

`advanced-table`의 `AdvancedTable<T>`는 `id: string` 행을 받습니다. 열에 `sortValue(row)`를
지정하면 정렬 버튼이 생깁니다. 숫자는 수치 순서, 문자열은 한국어 자연 순서로 정렬하며,
누락 값은 오름·내림차순 모두 끝에 놓습니다. 원본 배열은 변경하지 않습니다.

`selectedIds`와 `onSelectionChange`를 연결하면 행·현재 페이지 선택이 켜집니다.
페이지를 옮겨도 선택은 유지합니다. `actions`는 `{ id, label, run(selectedRows), destructive? }[]`입니다.
비동기 run이 실패하면 오류와 선택을 유지하고, 성공하면 선택을 해제합니다.
`pageSize` 기본값은 10이며 전체 배열에 대한 로컬 처리입니다. 서버 페이지 이동에는 별도 연결이 필요합니다.

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([])
<AdvancedTable rows={rows} selectedIds={selectedIds} onSelectionChange={setSelectedIds}
  columns={[{ key: "title", title: "제목", render: row => row.title, sortValue: row => row.title }]}
  actions={[{ id: "apply", label: "일괄 적용", run: selected => apply(selected) }]} />
```

## 고급 필터

`FilterBar`는 `fields`, `value`, `onChange`를 받는 제어형 UI입니다.
필드는 `{ id, label, type, options? }`이며 type은 text, select, multi, number-range, date-range입니다.
값은 문자열, 문자열 배열, 또는 `{ min?, max? }`이고 범위의 값도 문자열입니다.
옵션은 `{ value, label }[]`로 전달합니다.

필터는 값을 반환합니다. URL·API·표 연결은 호출자가 정합니다. 작은 배열이라면
`applyFilters(rows, fields, value, (row, id) => row[id])`로 로컬 필터링할 수 있습니다.
필드 간 AND, 다중 선택 내 OR 조건이며, 범위는 양 끝을 포함합니다. 빈 조건은 무시합니다.
잘못된 숫자·실제 달력에 없는 날짜·역전 범위는 `validateFilters`가 반환하고,
그때 `applyFilters`는 빈 배열을 반환합니다.

## 차트와 타임라인

`ChartPanel`은 `data`, `xKey`, `series: { key, label, color? }[]`를 받습니다.
`kind`는 bar(기본), line, area이며 `title`, `description`, `height`, `formatValue`를 바꿀 수 있습니다.
X축 키와 계열 키는 서로 다른 고유 키를 사용합니다. 데이터 집계는 전달 전에 처리합니다.
유한한 숫자만 표시하고 0·음수는 보존합니다. 문자열·누락 값은 빈 구간으로 둡니다.
원본 값을 펼쳐 볼 수 있는 표와 빈 상태가 포함됩니다. Recharts가 필요합니다.

`Timeline`의 `items`는 `{ id, title, description?, timeLabel?, dateTime?, state?, icon?, actions? }[]`입니다.
state는 complete, current, upcoming입니다. 호출자가 정한 순서와 시간 문구를 그대로 표시합니다.
actions는 ReactNode 슬롯입니다. 데이터 요청이나 상태 변경은 해당 슬롯의 콜백에서 연결합니다.

## 단계형 폼

`StepForm<T>`는 `initial`, `steps`, `submit`을 받습니다. 단계는
`{ id, title, description?, render, validate? }`입니다. render에 `{ values, change, errors, pending }`를
전달합니다. `change(key, value)`는 T의 필드 타입을 유지합니다.
validate는 동기·비동기 필드 오류 객체를 반환하며, 오류가 없을 때 다음 단계로 이동합니다.
이전 단계로 돌아가거나 제출이 실패해도 입력값을 보존합니다.

최종 `submit(values)`는 성공 시 undefined, 실패 시 `{ message, fields?, stepId? }`를 반환합니다.
stepId가 있으면 해당 단계로 돌아갑니다. 전체 스키마·서버 검증은 submit에서 수행합니다.
초기값은 마운트할 때 적용하므로 다른 레코드를 열 때는 key를 바꿉니다.

## 날짜 범위

`DateRangePicker`는 `value: { from?, to? }`, `onChange`를 받습니다. 값은 YYYY-MM-DD 형식입니다.
기본 프리셋은 오늘, 오늘 포함 최근 7일, 이번 달 시작부터 오늘까지입니다.
`presets: { label, range }[]`로 교체할 수 있습니다. 날짜 계산은 로컬 달력 기준입니다.
`dateRangePresets(now)`에 기준일을 전달하면 고정된 시연 날짜로 사용할 수 있습니다.

`validateDateRange(value)`로 실제 날짜와 시작·종료 순서를 확인합니다.
UI는 잘못된 범위를 수정할 수 있게 보존하므로 조회 전에 오류가 없는지 확인합니다.
한쪽 날짜만 지정할 수 있으며, API용 시간·타임존 변환은 호출자가 처리합니다.

## CSV

`csv`는 가져오기 UI와 다운로드 버튼, `csv-utils`는 UI 없는 함수만 가져옵니다.
`CsvImport`는 선택한 파일을 읽고 헤더와 행을 미리 보여 줍니다.
가져오기 버튼을 누르면 `onImport({ headers, rows })`가 실행됩니다.
실패하면 입력과 미리보기를 유지하고 재시도할 수 있습니다. 성공하면 선택을 비웁니다.
기본 maxBytes는 2,000,000, maxRows는 10,000, previewRows는 5입니다.

`CsvExportButton`에는 `rows`, `columns: { key, label, value(row) }[]`, `filename?`을 지정합니다.
UTF-8 BOM과 CRLF를 사용하며, 문자열이 수식 시작 문자로 시작하면 작은따옴표로 보호합니다.
실제 숫자 음수는 수치로 유지합니다. 내보내기는 브라우저 다운로드로 처리합니다.

`parseCsv(text, options?)`는 BOM·인용 쉼표·이스케이프 따옴표·여러 줄 셀을 지원합니다.
비어 있거나 중복된 헤더, 열 수 불일치, 닫히지 않은 따옴표는 오류입니다.
기본 제한은 1만 행·200열·200만 문자입니다. options의 delimiter와 각 제한을 바꿀 수 있습니다.
`stringifyCsv(columns, rows, { delimiter?, bom?, protectFormulas? })`는 문자열을 반환합니다.
필드 이름 매핑·숫자 변환·도메인 검증·서버 저장은 가져오기 콜백에서 처리합니다.

## 폼의 연결 규약

`RecordForm<T>`는 문자열 필드로 된 초기값과 `RecordField<T>[]`를 받습니다.
각 필드는 key·label과 type(text/email/tel/textarea), options, wide, placeholder를 선택합니다.
`render(value, onChange, id)` 슬롯으로 전화번호·주소·금액 입력을 연결할 수 있습니다.

`submit(values)`는 성공 시 undefined, 실패 시 `{ message, fields? }`를 반환하는 비동기 함수입니다.
스키마 검증과 API 요청은 이 콜백에서 연결합니다. 실패하면 입력값을 보존하고 필드 오류를 표시합니다.
폼은 모달이나 페이지에 자동 배치되지 않습니다. 필요한 위치에 직접 넣습니다.

## 상세·보드·지표의 연결 규약

`DetailPanel`의 open과 onOpenChange는 호출자가 관리합니다. fields의 value와 actions는 ReactNode라
링크·버튼·상태 표시를 자유롭게 넣을 수 있습니다. 수정·삭제 API는 부품이 알지 못합니다.

`StatusBoard<T>`는 status(row), groups, render(row), open(row), move(row, value)를 받습니다.
move에서 실제 상태 변경을 처리하고 pending으로 중복 동작을 막습니다. 드래그 기능은 포함하지 않습니다.
보드는 폼 부품에도 의존하지 않아 단독으로 꺼내 쓸 수 있습니다.

`MetricGrid`는 items의 label·value·caption·icon을 배치합니다. 수치를 계산하거나 예시 값을 생성하지 않습니다.

## 파일·요청 상태·확인의 연결 규약

`FileDrop`은 files와 onChange를 받습니다. 기본 제한은 파일당 10MB, 최대 5개이며 accept로
확장자·MIME을 지정합니다. 잘못된 파일이나 제한을 넘는 묶음은 기존 선택을 보존한 채 거절합니다.
renderPreview 슬롯으로 미리보기를 넣습니다. 실제 업로드·저장소 요청은 콜백에서 별도로 연결합니다.

`AsyncState`는 pending → error → empty → children 순서로 표시합니다. 재시도와 빈 상태 액션은
호출자가 전달합니다. `ConfirmAction`은 run이 성공하면 닫고, 실패하면 오류와 함께 열린 상태를 유지합니다.
실행 중에는 확인·취소·닫기로 중복 처리가 생기지 않게 합니다.

`kr-inputs`의 주소 검색은 요청할 때 외부 Daum 스크립트를 사용합니다. `kr-format`은 UI 없이
사용할 수 있으며 Zod 한국어 로케일을 설정합니다. `api-client`는 Vite의 VITE_API_URL과
localStorage의 slipway.token을 사용하므로 자신의 환경에 맞게 바꾸세요.

## 수정 위치와 경계

- 외형: 부품의 className과 공통 테마 토큰. 도메인 조건을 부품 내부에 넣지 않습니다.
- 필드·열·문구: 사용하는 화면의 설정과 렌더 콜백.
- 데이터·권한·검증: 자신의 API·Mock·스키마. 패턴은 이를 import하지 않습니다.
- 라우트·메뉴: 사용하는 사람이 필요한 부품을 선택한 뒤 등록합니다.
- 제품 이름·브랜드: src/config.ts와 src/index.css.

개별 부품의 조작 예시는 문서나 격리된 검증 환경에 둡니다. 고객 관리 같은 완성된 업무 앱을
코드팩의 기본 산출물로 만들지 않습니다. 실제로 조립할 때의 검증 기준은 FEATURE-WORKFLOW.md를 참고하세요.

## 부품 자체 검증

```sh
node scripts/pack.mjs check
corepack pnpm test
corepack pnpm --dir templates/react parts:verify
```

부품 테스트는 `fixtures/parts/`에서 한 부품씩만 로드합니다. 로그인·업무 라우트·API 서버 없이
데스크톱·좁은 화면·다크 모드의 입력, 오류, 콜백, 파일 제한을 확인합니다.
해당 HTML은 기본 앱의 진입점이나 운영 빌드에 연결되지 않습니다.
