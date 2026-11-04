"use client"

// Next.js version of the React preset's MobileShell: next/link and the pathname instead of TanStack Router.
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"
import type { ComponentType, ReactNode } from "react"
import { Drawer } from "vaul"

import { cn } from "@/shared/lib/utils"

export type TabItem = {
  to: string
  label: string
  /** Any icon component: lucide-react (installed), Tabler, Phosphor, Heroicons... */
  icon: ComponentType<{ className?: string }>
}

/**
 * Frame for an app used on a phone: one column (centered, with edges, on wider screens), an
 * optional top bar, and either bottom tabs or an action pinned to the bottom. The main content gets
 * the room the pinned parts take. In a layout route: `<MobileShell tabs={tabs}><Outlet /></MobileShell>`;
 * on a form screen: `<MobileShell top={<TopBar title="예약 받기" back="/bookings" />} bottom={<Button>…</Button>}>`.
 * The top bar and the bottom area take the column's background. The default background sits in the
 * base layer (`[data-slot="mobile-shell"]` in index.css), so a design's own screen class
 * (`className="k-screen k-plain"`) or a utility (`bg-card`) replaces it. The column width is
 * `--shell-width` (480px). The shell renders the page's `<main>`.
 */
export function MobileShell({
  top,
  tabs,
  bottom,
  className,
  children,
}: {
  top?: ReactNode
  tabs?: readonly TabItem[]
  /** Pinned to the bottom of the screen: the screen's main action. */
  bottom?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-slot="mobile-shell"
      className={cn(
        "relative mx-auto flex min-h-svh w-full max-w-[var(--shell-width,480px)] flex-col sm:border-x",
        className
      )}
    >
      {top}
      <main
        className={cn(
          "flex flex-1 flex-col",
          tabs && "pb-[calc(4rem+env(safe-area-inset-bottom))]",
          bottom && "pb-[calc(6rem+env(safe-area-inset-bottom))]"
        )}
      >
        {children}
      </main>
      {bottom && (
        // Side padding follows the design's page margin (--page-x) when the theme has one.
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[var(--shell-width,480px)] bg-inherit px-[var(--page-x,1rem)] pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {bottom}
        </div>
      )}
      {tabs && <TabBar tabs={tabs} />}
    </div>
  )
}

function TabBar({ tabs }: { tabs: readonly TabItem[] }) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="메뉴"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[var(--shell-width,480px)] border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map(({ to, label, icon: Icon }) => (
        <Link
          key={label}
          href={to}
          aria-current={(to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`)) ? "page" : undefined}
          className="flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground outline-offset-[-2px] aria-[current=page]:text-foreground"
        >
          <Icon className="size-6" />
          {label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * Back for a screen: returns to the previous page, or goes to `fallback` when the screen was opened
 * directly (a shared link, a reload). Use it on a design's own back button.
 */
export function useBack(fallback: string) {
  const router = useRouter()
  // A first page in the tab has no in-app history: fall back.
  return () => (window.history.length > 1 ? router.back() : router.push(fallback))
}

/**
 * Sticky bar above a screen: back on the left, the screen's title (its h1), and an optional end slot
 * (close, save). Back works as `useBack(back)`.
 */
export function TopBar({
  title,
  back,
  end,
}: {
  title?: ReactNode
  /** Where back goes when there is no previous page: "/orders" or "/orders/12". */
  back?: string
  end?: ReactNode
}) {
  const goBack = useBack(back ?? "/")
  return (
    <header className="sticky top-0 z-10 grid h-14 grid-cols-[minmax(3rem,auto)_1fr_minmax(3rem,auto)] items-center bg-inherit px-1">
      {back ? (
        <button
          type="button"
          aria-label="뒤로"
          className="grid size-11 place-items-center rounded-md"
          onClick={goBack}
        >
          <ChevronLeftIcon className="size-6" />
        </button>
      ) : (
        <span />
      )}
      {title ? (
        <h1 className="truncate text-center text-base font-semibold">{title}</h1>
      ) : (
        <span />
      )}
      <div className="flex justify-end">{end}</div>
    </header>
  )
}

/**
 * A sheet that slides up from the bottom of the column (vaul: drag down, Esc or the dim layer closes it,
 * focus stays inside). `className` replaces the panel's default look and `overlayClassName` the dim
 * layer's, so a design's own classes (`k-sheet`, `k-dim`) apply as they are. Name it with
 * `BottomSheetTitle` (any markup: `<BottomSheetTitle className="k-h2">김민지</BottomSheetTitle>`).
 */
export function BottomSheet({
  open,
  onOpenChange,
  className,
  overlayClassName,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  overlayClassName?: string
  children: ReactNode
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className={overlayClassName ?? "fixed inset-0 z-40 bg-black/40"} />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[var(--shell-width,480px)] outline-none",
            className ??
              "flex max-h-[85svh] flex-col gap-4 rounded-t-xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          )}
        >
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export const BottomSheetTitle = Drawer.Title
export const BottomSheetDescription = Drawer.Description
