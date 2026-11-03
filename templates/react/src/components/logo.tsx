import { AnchorIcon } from "lucide-react"

import { product } from "@/config"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground", className)}>
      <AnchorIcon className="size-4" strokeWidth={2.4} />
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      {product.name}
    </span>
  )
}
