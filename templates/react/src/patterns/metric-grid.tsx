import type { ReactNode } from "react"

export function MetricGrid({
  items,
}: {
  items: {
    label: string
    value: ReactNode
    caption: string
    icon?: ReactNode
  }[]
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs font-medium text-muted-foreground">
              {item.label}
            </dt>
            <span className="text-muted-foreground [&_svg]:size-4">
              {item.icon}
            </span>
          </div>
          <dd className="tabular mt-4 text-3xl font-semibold tracking-tight">
            {item.value}
          </dd>
          <p className="mt-1.5 text-xs text-muted-foreground">{item.caption}</p>
        </div>
      ))}
    </dl>
  )
}
