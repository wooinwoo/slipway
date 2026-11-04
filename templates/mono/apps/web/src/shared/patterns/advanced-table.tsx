import { useState } from "react"
import type { ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  sortRows,
  togglePageSelection,
  type SortDirection,
} from "@/shared/lib/table-model"

export type AdvancedColumn<T> = {
  key: string
  title: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number | null | undefined
}
export type BulkAction<T> = {
  id: string
  label: string
  run: (rows: T[]) => Promise<void>
  destructive?: boolean
}

export function AdvancedTable<T extends { id: string }>({
  rows,
  columns,
  onOpen,
  selectedIds = [],
  onSelectionChange,
  actions = [],
  pageSize = 10,
  rowLabel = (row) => row.id,
}: {
  rows: T[]
  columns: AdvancedColumn<T>[]
  onOpen?: (row: T) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  actions?: BulkAction<T>[]
  pageSize?: number
  rowLabel?: (row: T) => string
}) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>()
  const [page, setPage] = useState(0)
  const [pending, setPending] = useState<string>()
  const [error, setError] = useState<string>()
  const size = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 10
  const column = columns.find((item) => item.key === sort?.key)
  const sorted =
    sort && column?.sortValue
      ? sortRows(rows, column.sortValue, sort.direction)
      : rows
  const last = Math.max(0, Math.ceil(rows.length / size) - 1),
    current = Math.min(page, last)
  const visible = sorted.slice(current * size, (current + 1) * size)
  const selected = rows.filter((row) => selectedIds.includes(row.id))
  const validIds = selected.map((row) => row.id)
  const count = visible.filter((row) => selectedIds.includes(row.id)).length
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      {onSelectionChange && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-3">
          <span className="mr-auto text-sm font-medium">
            {selected.length}개 선택
          </span>
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={action.destructive ? "destructive" : "outline"}
              disabled={!!pending}
              onClick={async () => {
                if (pending) return
                setPending(action.id)
                setError(undefined)
                try {
                  await action.run([...selected])
                  onSelectionChange([])
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "처리하지 못했습니다. 다시 시도해 주세요."
                  )
                } finally {
                  setPending(undefined)
                }
              }}
            >
              {pending === action.id ? "처리 중…" : action.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            disabled={!!pending}
            onClick={() => onSelectionChange([])}
          >
            선택 해제
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="border-b px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {onSelectionChange && (
                <TableHead className="w-12 px-4">
                  <Checkbox
                    aria-label="현재 페이지 선택"
                    disabled={!!pending || !visible.length}
                    checked={
                      !!count && count === visible.length
                        ? true
                        : count
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) =>
                      onSelectionChange(
                        togglePageSelection(
                          validIds,
                          visible.map((row) => row.id),
                          checked === true
                        )
                      )
                    }
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="px-4"
                  aria-sort={
                    sort?.key === col.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 py-3 text-xs font-medium"
                      disabled={!!pending}
                      onClick={() => {
                        setSort({
                          key: col.key,
                          direction:
                            sort?.key === col.key && sort.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                        setPage(0)
                      }}
                    >
                      {col.title}
                      {sort?.key === col.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="size-3 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    col.title
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length ? (
              visible.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    selectedIds.includes(row.id) ? "selected" : undefined
                  }
                >
                  {onSelectionChange && (
                    <TableCell className="px-4">
                      <Checkbox
                        aria-label={`${rowLabel(row)} 선택`}
                        disabled={!!pending}
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={(checked) =>
                          onSelectionChange(
                            togglePageSelection(
                              validIds,
                              [row.id],
                              checked === true
                            )
                          )
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((col, i) => (
                    <TableCell key={col.key} className="h-14 px-4">
                      {i === 0 && onOpen ? (
                        <button
                          type="button"
                          className="rounded-sm text-left hover:text-primary"
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
                <TableCell
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="py-12 text-center text-muted-foreground"
                >
                  표시할 항목이 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <span>전체 {rows.length}개</span>
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
          <span>
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
