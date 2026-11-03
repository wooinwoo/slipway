import { useState } from "react"
import { AdvancedTable } from "@/patterns/advanced-table"
import { FilterBar } from "@/patterns/filter-bar"
import { ChartPanel } from "@/patterns/chart-panel"
import { StepForm } from "@/patterns/step-form"
import { DateRangePicker } from "@/patterns/date-range"
import { Timeline } from "@/patterns/timeline"
import { CsvImport, CsvExportButton } from "@/patterns/csv-transfer"
import {
  applyFilters,
  type FilterField,
  type FilterValues,
} from "@/lib/filter-model"
import { dateRangePresets, type DateRangeValue } from "@/lib/date-range"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function AdvancedFixture() {
  const rows = [
    { id: "a", name: "값 A", number: 10 },
    { id: "b", name: "값 B", number: 2 },
    { id: "c", name: "값 C", number: null },
    { id: "d", name: "값 D", number: 2 },
    { id: "e", name: "값 E", number: -1 },
  ]
  const [ids, setIds] = useState<string[]>([]),
    [attempts, setAttempts] = useState(0),
    [done, setDone] = useState("")
  return (
    <>
      <AdvancedTable
        rows={rows}
        pageSize={2}
        selectedIds={ids}
        onSelectionChange={setIds}
        rowLabel={(row) => row.name}
        columns={[
          {
            key: "name",
            title: "이름",
            render: (row) => row.name,
            sortValue: (row) => row.name,
          },
          {
            key: "number",
            title: "숫자",
            render: (row) => row.number ?? "—",
            sortValue: (row) => row.number,
          },
        ]}
        actions={[
          {
            id: "apply",
            label: "일괄 처리",
            run: async (selected) => {
              setAttempts((value) => value + 1)
              if (!attempts) throw new Error("검증 실패")
              setDone(selected.map((row) => row.id).join(","))
            },
          },
        ]}
      />
      <output>{done}</output>
    </>
  )
}
const fields: FilterField[] = [
  { id: "name", label: "검색", type: "text" },
  {
    id: "group",
    label: "분류",
    type: "select",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  {
    id: "team",
    label: "팀",
    type: "multi",
    options: [
      { value: "a", label: "팀 A" },
      { value: "b", label: "팀 B" },
    ],
  },
  { id: "number", label: "숫자", type: "number-range" },
  { id: "date", label: "날짜", type: "date-range" },
]
function FilterFixture() {
  const [value, setValue] = useState<FilterValues>({})
  const rows: Record<string, string | number>[] = [
    {
      id: "1",
      name: "Alpha",
      group: "a",
      team: "a",
      number: 2,
      date: "2026-11-01",
    },
    {
      id: "2",
      name: "Beta",
      group: "b",
      team: "a",
      number: 5,
      date: "2026-11-02",
    },
    {
      id: "3",
      name: "Gamma",
      group: "a",
      team: "b",
      number: 10,
      date: "2026-11-03",
    },
  ]
  return (
    <>
      <FilterBar fields={fields} value={value} onChange={setValue} />
      <output>
        {applyFilters(rows, fields, value, (row, id) => row[id])
          .map((row) => row.id)
          .join(",")}
      </output>
    </>
  )
}
function ChartFixture() {
  const [kind, setKind] = useState<"bar" | "line" | "area">("bar")
  return (
    <>
      <select
        aria-label="차트 종류"
        value={kind}
        onChange={(event) => setKind(event.target.value as typeof kind)}
      >
        <option value="bar">막대</option>
        <option value="line">선</option>
        <option value="area">영역</option>
      </select>
      <ChartPanel
        title="전달한 수치"
        kind={kind}
        xKey="label"
        data={[
          { label: "A", first: 0, second: 5 },
          { label: "B", first: 10, second: null },
          { label: "C", first: -2, second: 3 },
        ]}
        series={[
          { key: "first", label: "값 1" },
          { key: "second", label: "값 2" },
        ]}
      />
    </>
  )
}
function StepFixture() {
  const [attempt, setAttempt] = useState(0),
    [done, setDone] = useState(false)
  return (
    <>
      <StepForm
        initial={{ name: "", number: 0 }}
        steps={[
          {
            id: "name",
            title: "첫 단계",
            validate: (values) =>
              values.name.trim() ? {} : { name: "값을 입력하세요" },
            render: ({ values, change, errors }) => (
              <>
                <Label htmlFor="step-name">값</Label>
                <Input
                  id="step-name"
                  value={values.name}
                  onChange={(event) => change("name", event.target.value)}
                />
                {errors.name && <p>{errors.name}</p>}
              </>
            ),
          },
          {
            id: "number",
            title: "다음 단계",
            validate: (values) =>
              values.number > 0 ? {} : { number: "양수를 입력하세요" },
            render: ({ values, change, errors }) => (
              <>
                <Label htmlFor="step-number">숫자</Label>
                <Input
                  id="step-number"
                  type="number"
                  value={values.number}
                  onChange={(event) =>
                    change("number", Number(event.target.value))
                  }
                />
                {errors.number && <p>{errors.number}</p>}
              </>
            ),
          },
        ]}
        submit={async () => {
          setAttempt((value) => value + 1)
          if (!attempt)
            return {
              message: "서버 검증 실패",
              fields: { name: "다시 확인하세요" },
              stepId: "name",
            }
          setDone(true)
        }}
      />
      <output>{done ? "완료" : "진행 전"}</output>
    </>
  )
}
function DateFixture() {
  const [value, setValue] = useState<DateRangeValue>({})
  return (
    <>
      <DateRangePicker
        value={value}
        onChange={setValue}
        presets={dateRangePresets(new Date(2026, 10, 4, 12))}
      />
      <output>{JSON.stringify(value)}</output>
    </>
  )
}
function TimelineFixture() {
  const [empty, setEmpty] = useState(false),
    [calls, setCalls] = useState(0)
  return (
    <>
      <Button onClick={() => setEmpty(true)}>비우기</Button>
      <Timeline
        items={
          empty
            ? []
            : [
                {
                  id: "1",
                  title: "값 1",
                  state: "complete",
                  timeLabel: "어제",
                },
                {
                  id: "2",
                  title: "값 2",
                  state: "current",
                  description: "전달한 설명",
                  actions: (
                    <Button onClick={() => setCalls((value) => value + 1)}>
                      슬롯 동작
                    </Button>
                  ),
                },
                { id: "3", title: "값 3", state: "upcoming" },
              ]
        }
      />
      <output>{calls}</output>
    </>
  )
}
function CsvFixture() {
  const [attempt, setAttempt] = useState(0),
    [count, setCount] = useState(0)
  return (
    <>
      <CsvImport
        onImport={async (document) => {
          setAttempt((value) => value + 1)
          if (!attempt) throw new Error("검증 실패")
          setCount(document.rows.length)
        }}
      />
      <output>전달 {count}행</output>
      <CsvExportButton
        filename="part-data.csv"
        rows={[
          { text: "=A1", number: -2 },
          { text: '값, "인용"', number: 0 },
        ]}
        columns={[
          { key: "text", label: "값", value: (row) => row.text },
          { key: "number", label: "숫자", value: (row) => row.number },
        ]}
      />
    </>
  )
}
export const extraFixtures = {
  "advanced-table": AdvancedFixture,
  filters: FilterFixture,
  chart: ChartFixture,
  wizard: StepFixture,
  "date-range": DateFixture,
  timeline: TimelineFixture,
  csv: CsvFixture,
}
