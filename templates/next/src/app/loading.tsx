import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-[50svh] items-center justify-center" aria-busy="true" aria-label="불러오는 중">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  )
}
