export type ChartSeries = { key: string; label: string; color?: string }
export function normalizeChartData(
  data: readonly Record<string, unknown>[],
  xKey: string,
  series: readonly ChartSeries[]
): Record<string, string | number | null>[] {
  return data.map((row, index) =>
    Object.fromEntries([
      [xKey, row[xKey] == null ? String(index + 1) : String(row[xKey])],
      ...series.map((item) => [
        item.key,
        typeof row[item.key] === "number" && Number.isFinite(row[item.key])
          ? (row[item.key] as number)
          : null,
      ]),
    ])
  )
}
