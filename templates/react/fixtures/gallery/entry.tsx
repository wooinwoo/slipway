// Pattern gallery for README images. Isolated like fixtures/parts: not imported by the app.
// pnpm dev, then open /fixtures/gallery/index.html (add ?theme=dark for dark mode).
import { createRoot } from "react-dom/client"
import { useState, type ReactNode } from "react"
import {
  ClockIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
  WalletIcon,
} from "lucide-react"
import "../../src/index.css"
import { AdvancedTable } from "@/patterns/advanced-table"
import { ChartPanel } from "@/patterns/chart-panel"
import { FilterBar } from "@/patterns/filter-bar"
import { MetricGrid } from "@/patterns/metric-grid"
import { RecordForm } from "@/patterns/record-form"
import { StatusBoard } from "@/patterns/status-board"
import { Timeline } from "@/patterns/timeline"
import { PhoneInput } from "@/components/kr-inputs"
import { Badge } from "@/components/ui/badge"
import type { FilterField, FilterValues } from "@/lib/filter-model"
import { formatWon } from "@/lib/kr"

const orders = [
  { id: "A-1042", customer: "한빛상사", amount: 1280000, state: "결제 완료" },
  { id: "A-1041", customer: "누리디자인", amount: 452000, state: "배송 중" },
  { id: "A-1040", customer: "솔빛커피 성수점", amount: 96000, state: "배송 중" },
  { id: "A-1039", customer: "다온테크", amount: 3150000, state: "결제 완료" },
  { id: "A-1038", customer: "푸른숲 어린이집", amount: 214000, state: "배송 완료" },
]

const filterFields: FilterField[] = [
  { id: "q", label: "검색", type: "text" },
  {
    id: "state",
    label: "상태",
    type: "multi",
    options: [
      { value: "paid", label: "결제 완료" },
      { value: "shipping", label: "배송 중" },
      { value: "done", label: "배송 완료" },
    ],
  },
  { id: "amount", label: "금액", type: "number-range" },
]

const tasks = [
  { id: "t1", title: "결제 실패 알림 문구", owner: "디자인", state: "todo" },
  { id: "t2", title: "정산 CSV 내보내기", owner: "백엔드", state: "todo" },
  { id: "t3", title: "주문 상세 슬라이드 패널", owner: "프론트", state: "doing" },
  { id: "t4", title: "카카오 로그인 연결", owner: "백엔드", state: "done" },
]

function Shot({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section data-shot={name} className="grid gap-4 bg-background p-6">
      {children}
    </section>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-5 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function Gallery() {
  const [selected, setSelected] = useState(["A-1041", "A-1040"])
  const [filters, setFilters] = useState<FilterValues>({ state: ["paid", "shipping"] })
  const [board, setBoard] = useState(tasks)
  return (
    <main className="grid gap-2">
      <Shot name="overview">
        <MetricGrid
          items={[
            { label: "이번 달 매출", value: formatWon(48250000), caption: "지난달보다 12% 증가", icon: <WalletIcon /> },
            { label: "신규 주문", value: "1,284", caption: "오늘 86건", icon: <ShoppingBagIcon /> },
            { label: "처리 대기", value: "23", caption: "평균 4시간 안에 처리", icon: <ClockIcon /> },
            { label: "배송 완료율", value: "98.2%", caption: "최근 30일", icon: <PackageCheckIcon /> },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <ChartPanel
            title="채널별 매출"
            description="단위: 만 원"
            kind="area"
            xKey="month"
            height={260}
            formatValue={(value) => `${value.toLocaleString("ko-KR")}만`}
            data={[
              { month: "6월", online: 1820, store: 1240 },
              { month: "7월", online: 2140, store: 1310 },
              { month: "8월", online: 2010, store: 1420 },
              { month: "9월", online: 2580, store: 1380 },
              { month: "10월", online: 2960, store: 1510 },
              { month: "11월", online: 3240, store: 1585 },
            ]}
            series={[
              { key: "online", label: "온라인" },
              { key: "store", label: "매장" },
            ]}
          />
          <Card title="주문 A-1041">
            <Timeline
              items={[
                { id: "1", title: "주문 접수", state: "complete", timeLabel: "11월 3일 09:12" },
                { id: "2", title: "결제 완료", state: "complete", timeLabel: "11월 3일 09:13" },
                { id: "3", title: "배송 중", state: "current", description: "CJ대한통운 6824-1937-0412", timeLabel: "오늘 08:40" },
                { id: "4", title: "배송 완료", state: "upcoming" },
              ]}
            />
          </Card>
        </div>
      </Shot>

      <Shot name="list">
        <FilterBar fields={filterFields} value={filters} onChange={setFilters} />
        <AdvancedTable
          rows={orders}
          selectedIds={selected}
          onSelectionChange={setSelected}
          rowLabel={(row) => row.id}
          columns={[
            { key: "id", title: "주문번호", render: (row) => <span className="tabular">{row.id}</span>, sortValue: (row) => row.id },
            { key: "customer", title: "고객", render: (row) => row.customer, sortValue: (row) => row.customer },
            { key: "amount", title: "금액", render: (row) => <span className="tabular">{formatWon(row.amount)}</span>, sortValue: (row) => row.amount },
            { key: "state", title: "상태", render: (row) => <Badge variant={row.state === "배송 완료" ? "secondary" : "outline"}>{row.state}</Badge> },
          ]}
          actions={[
            { id: "ship", label: "배송 처리", run: async () => {} },
            { id: "cancel", label: "주문 취소", destructive: true, run: async () => {} },
          ]}
        />
      </Shot>

      <Shot name="board">
        <StatusBoard
          rows={board}
          groups={[
            { value: "todo", label: "할 일" },
            { value: "doing", label: "진행 중" },
            { value: "done", label: "완료" },
          ]}
          status={(row) => row.state}
          render={(row) => (
            <>
              <p className="font-medium">{row.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{row.owner}</p>
            </>
          )}
          open={() => {}}
          move={(row, state) => setBoard(board.map((item) => (item.id === row.id ? { ...item, state } : item)))}
        />
      </Shot>

      <Shot name="form">
        <Card title="거래처 등록">
          <RecordForm
            initial={{ name: "한빛상사", email: "order@hanbit.co.kr", phone: "010-1234-5678", grade: "vip", memo: "매월 말일 정산. 세금계산서는 담당자 메일로 발행." }}
            fields={[
              { key: "name", label: "거래처명" },
              { key: "email", label: "이메일", type: "email" },
              { key: "phone", label: "전화번호", render: (value, onChange, id) => <PhoneInput id={id} value={value} onChange={onChange} /> },
              { key: "grade", label: "등급", options: [{ value: "vip", label: "VIP" }, { value: "normal", label: "일반" }] },
              { key: "memo", label: "메모", type: "textarea", wide: true },
            ]}
            cancel={() => {}}
            submit={async () => undefined}
          />
        </Card>
      </Shot>
    </main>
  )
}

if (new URLSearchParams(location.search).get("theme") === "dark")
  document.documentElement.classList.add("dark")
createRoot(document.getElementById("gallery")!).render(<Gallery />)
