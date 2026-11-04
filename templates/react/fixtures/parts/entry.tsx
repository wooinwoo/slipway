// Isolated component tests only. Not imported by the application or production entry.
import { createRoot } from "react-dom/client"
import { useState } from "react"
import "../../src/index.css"
import { DataTable } from "@/patterns/data-table"
import { RecordForm } from "@/patterns/record-form"
import { DetailPanel } from "@/patterns/detail-panel"
import { StatusBoard } from "@/patterns/status-board"
import { MetricGrid } from "@/patterns/metric-grid"
import { FileDrop } from "@/patterns/file-drop"
import { AsyncState } from "@/patterns/async-state"
import { ConfirmAction } from "@/patterns/confirm-action"
import { PhoneInput, BizNoInput, WonInput } from "@/components/kr-inputs"
import { Button } from "@/components/ui/button"
import { extraFixtures } from "./extra"
import { frameFixtures } from "./frame"

function TableFixture() {
  const [rows, setRows] = useState(
    Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      label: `값 ${i + 1}`,
    }))
  )
  const [selected, setSelected] = useState("")
  return (
    <>
      <DataTable
        rows={rows}
        pageSize={2}
        columns={[{ key: "label", title: "값", render: (row) => row.label }]}
        onOpen={(row) => setSelected(row.label)}
      />
      <Button onClick={() => setRows(rows.slice(0, 1))}>행 줄이기</Button>
      <output>{selected}</output>
    </>
  )
}
function FormFixture() {
  const [saved, setSaved] = useState(false)
  return (
    <>
      <RecordForm
        initial={{ value: "", mode: "a", note: "" }}
        fields={[
          { key: "value", label: "값" },
          {
            key: "mode",
            label: "선택",
            options: [
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ],
          },
          { key: "note", label: "메모", type: "textarea", wide: true },
        ]}
        cancel={() => setSaved(false)}
        submit={async (values) => {
          if (values.value === "실패")
            return {
              message: "검증 실패",
              fields: { value: "다른 값을 입력하세요" },
            }
          setSaved(true)
          return undefined
        }}
      />
      <output>{saved ? "저장 완료" : "저장 전"}</output>
    </>
  )
}
function DetailsFixture() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>열기</Button>
      <DetailPanel
        open={open}
        onOpenChange={setOpen}
        title="상세 값"
        description="필드 슬롯 검증"
        fields={[
          { label: "값", value: "선택한 값" },
          { label: "빈 값", value: "" },
        ]}
        actions={<Button onClick={() => setOpen(false)}>작업 완료</Button>}
      />
    </>
  )
}
function BoardFixture() {
  const [rows, setRows] = useState([{ id: "1", label: "값 A", state: "a" }])
  return (
    <StatusBoard
      rows={rows}
      groups={[
        { value: "a", label: "그룹 A" },
        { value: "b", label: "그룹 B" },
      ]}
      status={(row) => row.state}
      render={(row) => row.label}
      open={() => {}}
      move={(row, state) =>
        setRows(
          rows.map((item) => (item.id === row.id ? { ...item, state } : item))
        )
      }
    />
  )
}
function FilesFixture() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <FileDrop
      files={files}
      onChange={setFiles}
      accept=".pdf"
      maxBytes={1024}
      maxFiles={2}
    />
  )
}
function AsyncFixture() {
  const [state, setState] = useState("pending")
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {["pending", "error", "empty", "ready"].map((mode) => (
          <Button key={mode} variant="outline" onClick={() => setState(mode)}>
            {mode}
          </Button>
        ))}
      </div>
      <AsyncState
        pending={state === "pending"}
        error={state === "error" ? new Error("검증 오류") : null}
        empty={state === "empty"}
        retry={() => setState("ready")}
        emptyAction={<Button onClick={() => setState("ready")}>추가</Button>}
      >
        <p>콘텐츠 준비 완료</p>
      </AsyncState>
    </>
  )
}
function ConfirmFixture() {
  const [calls, setCalls] = useState(0)
  return (
    <>
      <ConfirmAction
        trigger={<Button>실행</Button>}
        title="확인"
        description="콜백과 재시도 검증"
        run={async () => {
          setCalls((previous) => previous + 1)
          // Long enough for the test to observe the pending state on a busy machine.
          await new Promise((resolve) => setTimeout(resolve, 1500))
          if (!calls) throw new Error("검증 실패")
        }}
      />
      <output>실행 횟수 {calls}</output>
    </>
  )
}
function InputsFixture() {
  const [phone, setPhone] = useState("")
  const [biz, setBiz] = useState("")
  const [won, setWon] = useState(0)
  return (
    <>
      <PhoneInput aria-label="전화번호" value={phone} onChange={setPhone} />
      <BizNoInput aria-label="사업자번호" value={biz} onChange={setBiz} />
      <WonInput aria-label="금액" value={won} onChange={setWon} />
    </>
  )
}

const fixtures = {
  ...extraFixtures,
  ...frameFixtures,
  table: TableFixture,
  form: FormFixture,
  details: DetailsFixture,
  board: BoardFixture,
  files: FilesFixture,
  "async-state": AsyncFixture,
  confirm: ConfirmFixture,
  "kr-inputs": InputsFixture,
  metrics: () => (
    <MetricGrid
      items={[
        { label: "값 A", value: 12, caption: "입력한 값" },
        { label: "값 B", value: 3, caption: "입력한 값" },
      ]}
    />
  ),
}
const params = new URLSearchParams(location.search)
if (params.get("theme") === "dark")
  document.documentElement.classList.add("dark")
const part = params.get("part") ?? "table"
const Component = fixtures[part as keyof typeof fixtures]
createRoot(document.getElementById("fixture")!).render(
  <main className="mx-auto grid w-full max-w-4xl gap-5 p-5">
    <h1 className="text-sm font-medium text-muted-foreground">
      부품 검증: {part}
    </h1>
    {Component ? <Component /> : <p>없는 부품</p>}
  </main>
)
