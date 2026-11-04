export type SortDirection = "asc" | "desc"
const collator = new Intl.Collator("ko-KR", {
  numeric: true,
  sensitivity: "base",
})

/** Stable ordering, missing values last in either direction. Never mutates input. */
export function sortRows<T>(
  rows: readonly T[],
  value: (row: T) => string | number | null | undefined,
  direction: SortDirection
): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const av = value(a.row),
        bv = value(b.row)
      const am = av == null || (typeof av === "number" && !Number.isFinite(av))
      const bm = bv == null || (typeof bv === "number" && !Number.isFinite(bv))
      if (am || bm) return am === bm ? a.index - b.index : am ? 1 : -1
      const order =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : collator.compare(String(av), String(bv))
      return (direction === "asc" ? order : -order) || a.index - b.index
    })
    .map((item) => item.row)
}

export function togglePageSelection(
  selected: readonly string[],
  pageIds: readonly string[],
  checked: boolean
): string[] {
  return checked
    ? [...new Set([...selected, ...pageIds])]
    : selected.filter((id) => !pageIds.includes(id))
}
