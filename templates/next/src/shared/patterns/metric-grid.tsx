"use client"

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
    // Two across even on phones: four numbers should not push the content below the first screen.
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
          <dt className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            {item.label}
            <span aria-hidden className="[&_svg]:size-4">
              {item.icon}
            </span>
          </dt>
          <dd className="tabular mt-3 text-2xl font-semibold tracking-tight sm:mt-4 sm:text-3xl">
            {item.value}
          </dd>
          <dd className="mt-1.5 text-xs text-muted-foreground">{item.caption}</dd>
        </div>
      ))}
    </dl>
  )
}
