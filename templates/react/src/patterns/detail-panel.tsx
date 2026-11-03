import type { ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function DetailPanel({
  open,
  onOpenChange,
  title,
  description,
  fields,
  actions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  fields: { label: string; value: ReactNode }[]
  actions?: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b pb-5">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <dl className="grid gap-6 px-6 py-3">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="mb-2 text-xs text-muted-foreground">
                {field.label}
              </dt>
              <dd className="text-sm break-words whitespace-pre-wrap">
                {field.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex gap-2 border-t p-6">{actions}</div>
      </SheetContent>
    </Sheet>
  )
}
