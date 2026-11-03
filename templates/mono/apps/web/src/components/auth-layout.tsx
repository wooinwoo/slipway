import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { Logo } from "@/components/logo"
import { product } from "@/config"

export function AuthLayout({ title, description, children, footer }: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center px-6 py-10">
      {/* a faint wash of the brand color at the top, nothing more */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]"
      />
      <Link to="/" className="relative" aria-label={`${product.name} 처음으로`}>
        <Logo />
      </Link>
      <main className="relative flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>
      </main>
    </div>
  )
}

export function KakaoButton(props: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      aria-label="카카오로 계속하기"
      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-sm font-medium text-black/85 transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="currentColor" d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.88 5.32 4.71 6.74l-.96 3.53c-.08.31.27.56.54.38l4.2-2.78c.5.06 1 .1 1.51.1 5.52 0 10-3.58 10-8S17.52 3 12 3Z" />
      </svg>
      카카오
    </button>
  )
}

export function NaverButton(props: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      aria-label="네이버로 계속하기"
      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
        <path fill="currentColor" d="M16.27 12.84 7.38 0H0v24h7.73V11.16L16.62 24H24V0h-7.73z" />
      </svg>
      네이버
    </button>
  )
}
