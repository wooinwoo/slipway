export type DateRangeValue = { from?: string; to?: string }
export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
export function validateDateRange(value: DateRangeValue): string | undefined {
  if (
    (value.from && !isDateOnly(value.from)) ||
    (value.to && !isDateOnly(value.to))
  )
    return "날짜를 확인해 주세요"
  if (value.from && value.to && value.from > value.to)
    return "종료일은 시작일 이후여야 합니다"
  return undefined
}
function localDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function dateRangePresets(
  now = new Date()
): { label: string; range: DateRangeValue }[] {
  const to = localDate(now)
  return [
    { label: "오늘", range: { from: to, to } },
    {
      label: "최근 7일",
      range: {
        from: localDate(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
        ),
        to,
      },
    },
    {
      label: "이번 달",
      range: {
        from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to,
      },
    },
  ]
}
