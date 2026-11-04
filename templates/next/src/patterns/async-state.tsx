"use client"

import type { ReactNode } from "react"
import { InboxIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function AsyncState({
  pending,
  error,
  empty,
  retry,
  emptyTitle = "아직 항목이 없습니다",
  emptyDescription = "새 항목을 추가해서 시작해 보세요.",
  emptyAction,
  children,
}: {
  pending?: boolean
  error?: Error | string | null
  empty?: boolean
  retry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  children: ReactNode
}) {
  if (pending)
    return (
      <div
        role="status"
        aria-label="불러오는 중"
        className="grid gap-3 rounded-xl border p-6"
      >
        <span className="sr-only">불러오는 중</span>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  if (error)
    return (
      <div
        role="alert"
        className="grid justify-items-center gap-3 rounded-xl border p-10 text-center"
      >
        <TriangleAlertIcon className="size-7 text-destructive" />
        <h2 className="text-sm font-medium">불러오지 못했습니다</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error instanceof Error ? error.message : error}
        </p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            다시 시도
          </Button>
        )}
      </div>
    )
  if (empty)
    return (
      <div className="grid justify-items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <InboxIcon className="size-7 text-muted-foreground" />
        <h2 className="text-sm font-medium">{emptyTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {emptyDescription}
        </p>
        {emptyAction}
      </div>
    )
  return <>{children}</>
}
