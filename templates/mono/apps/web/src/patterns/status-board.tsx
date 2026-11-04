import type { ReactNode, CSSProperties } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export type StatusGroup = { value: string; label: string }

/** Keyboard-friendly status changes; no drag-and-drop dependency. */
export function StatusBoard<T extends { id: string }>({
  rows,
  groups,
  status,
  render,
  open,
  move,
  pending,
  empty = "아직 항목이 없습니다",
}: {
  rows: T[]
  groups: readonly StatusGroup[]
  status: (row: T) => string
  render: (row: T) => ReactNode
  open: (row: T) => void
  move: (row: T, value: string) => void
  pending?: boolean
  /** Shown in a column with no cards. */
  empty?: ReactNode
}) {
  return (
    // One column per group on wide screens (up to four side by side), two on tablets, one on phones.
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-[repeat(var(--board-columns),minmax(0,1fr))]"
      style={{ "--board-columns": Math.min(groups.length, 4) } as CSSProperties}
    >
      {groups.map((group) => {
        const items = rows.filter((row) => status(row) === group.value)
        return (
          <section
            key={group.value}
            aria-label={`${group.label} 보드`}
            className="rounded-xl border bg-muted/35 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1 py-1.5">
              <h2 className="text-sm font-semibold">{group.label}</h2>
              <Badge variant="secondary" className="tabular">
                {items.length}
              </Badge>
            </div>
            <div className="grid gap-3">
              {items.map((row) => (
                <article
                  key={row.id}
                  className="rounded-lg border bg-card p-4 shadow-xs"
                >
                  <button
                    className="w-full rounded-sm text-left outline-offset-4 hover:text-primary focus-visible:outline-2"
                    onClick={() => open(row)}
                  >
                    {render(row)}
                  </button>
                  <div className="mt-4 border-t pt-3">
                    <Select
                      value={status(row)}
                      onValueChange={(value) => move(row, value)}
                      disabled={pending}
                    >
                      <SelectTrigger
                        aria-label="상태 변경"
                        className="h-7 w-full text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </article>
              ))}
              {!items.length && (
                <p className="rounded-lg border border-dashed py-10 text-center text-xs text-muted-foreground">
                  {empty}
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
