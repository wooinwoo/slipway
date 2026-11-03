import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { normalizeChartData, type ChartSeries } from "@/lib/chart-model"

export function ChartPanel({
  data,
  xKey,
  series,
  kind = "bar",
  title = "차트",
  description,
  height = 280,
  formatValue = (value) => value.toLocaleString("ko-KR"),
}: {
  data: Record<string, unknown>[]
  xKey: string
  series: ChartSeries[]
  kind?: "bar" | "line" | "area"
  title?: string
  description?: string
  height?: number
  formatValue?: (value: number) => string
}) {
  const rows = normalizeChartData(data, xKey, series)
  const colors = (index: number) =>
    series[index].color ?? `var(--chart-${(index % 5) + 1})`
  const content = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey={xKey}
        tickLine={false}
        axisLine={false}
        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={56}
        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        tickFormatter={formatValue}
      />
      <Tooltip
        contentStyle={{
          background: "var(--popover)",
          borderColor: "var(--border)",
          borderRadius: 10,
          color: "var(--foreground)",
        }}
        formatter={(value) =>
          typeof value === "number" ? formatValue(value) : String(value ?? "")
        }
      />
      <Legend />
    </>
  )
  const valid = rows.some((row) =>
    series.some((item) => typeof row[item.key] === "number")
  )
  return (
    <figure className="min-w-0 rounded-xl border bg-card p-5">
      <figcaption className="mb-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </figcaption>
      {!series.length || !valid ? (
        <p
          role="status"
          className="py-16 text-center text-sm text-muted-foreground"
        >
          표시할 데이터가 없습니다
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={title}
            className="min-w-0"
            style={{
              height: Number.isFinite(height) ? Math.max(160, height) : 280,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {kind === "line" ? (
                <LineChart data={rows}>
                  {content}
                  {series.map((item, i) => (
                    <Line
                      key={item.key}
                      name={item.label}
                      dataKey={item.key}
                      stroke={colors(i)}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              ) : kind === "area" ? (
                <AreaChart data={rows}>
                  {content}
                  {series.map((item, i) => (
                    <Area
                      key={item.key}
                      name={item.label}
                      dataKey={item.key}
                      stroke={colors(i)}
                      fill={colors(i)}
                      fillOpacity={0.12}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={rows}>
                  {content}
                  {series.map((item, i) => (
                    <Bar
                      key={item.key}
                      name={item.label}
                      dataKey={item.key}
                      fill={colors(i)}
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <details className="mt-4 border-t pt-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              데이터 표 보기
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="p-2">{xKey}</th>
                    {series.map((item) => (
                      <th key={item.key} className="p-2">
                        {item.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <th className="p-2 font-normal">{row[xKey]}</th>
                      {series.map((item) => (
                        <td className="tabular p-2" key={item.key}>
                          {typeof row[item.key] === "number"
                            ? formatValue(row[item.key] as number)
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  )
}
