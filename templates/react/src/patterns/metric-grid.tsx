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
          <dt className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            {item.label}
            <span aria-hidden className="[&_svg]:size-4">
              {item.icon}
            </span>
          </dt>
          <dd className="tabular mt-4 text-3xl font-semibold tracking-tight">
            {item.value}
          </dd>
          <dd className="mt-1.5 text-xs text-muted-foreground">{item.caption}</dd>
        </div>
      ))}
    </dl>
  )
}
