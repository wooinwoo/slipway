"use client"

import { TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>화면을 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>{error.message || "잠시 후 다시 시도해 주세요."}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>다시 시도</Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
