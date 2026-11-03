// Router-wide fallbacks: shown while a loader runs, when one throws, or when a page is missing.
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router"
import { SearchXIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

export function RoutePending() {
  return (
    <div className="flex min-h-[50svh] items-center justify-center" aria-busy="true" aria-label="불러오는 중">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  )
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon"><TriangleAlertIcon /></EmptyMedia>
        <EmptyTitle>화면을 불러오지 못했습니다</EmptyTitle>
        <EmptyDescription>{(error instanceof Error && error.message) || "잠시 후 다시 시도해 주세요."}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          onClick={() => {
            reset()
            router.invalidate()
          }}
        >
          다시 시도
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function RouteNotFound({ title = "페이지를 찾을 수 없습니다", backTo = "/" }: { title?: string; backTo?: string }) {
  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SearchXIcon /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>주소가 바뀌었거나 삭제되었습니다.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link to={backTo}>돌아가기</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
