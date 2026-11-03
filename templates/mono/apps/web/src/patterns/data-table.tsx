import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  SearchIcon,
} from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Column<T> = {
  key: string
  title: string
  render: (row: T) => ReactNode
}

/** Local pagination. Fetch a server page instead for large datasets. */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onOpen,
  pageSize = 6,
}: {
  rows: T[]
  columns: Column<T>[]
  onOpen: (row: T) => void
  pageSize?: number
}) {
  const [page, setPage] = useState(0)
  const last = Math.max(0, Math.ceil(rows.length / pageSize) - 1)
  const current = Math.min(page, last)
  const visible = rows.slice(current * pageSize, (current + 1) * pageSize)
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead key={col.key} className="h-11 px-5 text-xs">
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length ? (
              visible.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col, i) => (
                    <TableCell key={col.key} className="h-18 px-5">
                      {i === 0 ? (
                        <button
                          className="w-full rounded-sm text-left outline-offset-4 hover:text-primary focus-visible:outline-2"
                          onClick={() => onOpen(row)}
                        >
                          {col.render(row)}
                        </button>
                      ) : (
                        col.render(row)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="grid justify-items-center gap-2 py-16 text-muted-foreground">
                    <InboxIcon className="size-7" />
                    <p>표시할 항목이 없습니다</p>
                    <p className="text-xs">
                      검색 조건을 바꾸거나 새 항목을 추가해 보세요.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
        <span>
          전체 {rows.length}개 · {rows.length ? current * pageSize + 1 : 0}–
          {Math.min((current + 1) * pageSize, rows.length)}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="이전 페이지"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="tabular">
            {current + 1} / {last + 1}
          </span>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="다음 페이지"
            disabled={current === last}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = "검색",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon
        aria-hidden
        className="absolute top-2.5 left-3 size-4 text-muted-foreground"
      />
      <Input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-9"
      />
    </div>
  )
}
