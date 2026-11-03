import type { ReactNode } from "react"
import { CheckIcon, CircleIcon, Clock3Icon } from "lucide-react"

export type TimelineItem = {
  id: string
  title: ReactNode
  description?: ReactNode
  timeLabel?: ReactNode
  dateTime?: string
  state?: "complete" | "current" | "upcoming"
  icon?: ReactNode
  actions?: ReactNode
}
export function Timeline({
  items,
  label = "진행 기록",
  empty = "표시할 기록이 없습니다",
}: {
  items: TimelineItem[]
  label?: string
  empty?: ReactNode
}) {
  if (!items.length)
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    )
  return (
    <ol aria-label={label} className="grid gap-6">
      {items.map((item, index) => (
        <li key={item.id} className="relative min-w-0 pl-10">
          {index < items.length - 1 && (
            <span
              aria-hidden
              className="absolute top-8 -bottom-6 left-3.5 border-l"
            />
          )}
          <span
            aria-hidden
            className={`absolute top-0 left-0 flex size-7 items-center justify-center rounded-full border [&_svg]:size-3.5 ${item.state === "current" ? "border-primary bg-primary/10 text-primary" : item.state === "complete" ? "border-primary/20 bg-primary/5 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {item.icon ??
              (item.state === "complete" ? (
                <CheckIcon />
              ) : item.state === "current" ? (
                <Clock3Icon />
              ) : (
                <CircleIcon />
              ))}
          </span>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-medium">
              {item.title}
              <span className="sr-only">
                {" "}
                ·{" "}
                {item.state === "complete"
                  ? "완료"
                  : item.state === "current"
                    ? "진행 중"
                    : "예정"}
              </span>
            </h3>
            {item.timeLabel && (
              <time
                dateTime={item.dateTime}
                className="text-xs text-muted-foreground"
              >
                {item.timeLabel}
              </time>
            )}
          </div>
          {item.description && (
            <div className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
              {item.description}
            </div>
          )}
          {item.actions && (
            <div className="mt-3 flex flex-wrap gap-2">{item.actions}</div>
          )}
        </li>
      ))}
    </ol>
  )
}
