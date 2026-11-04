import Link from "next/link"
import { SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export const metadata = { title: "페이지를 찾을 수 없습니다" }

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>페이지를 찾을 수 없습니다</EmptyTitle>
          <EmptyDescription>주소가 바뀌었거나 삭제되었습니다.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/">돌아가기</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
