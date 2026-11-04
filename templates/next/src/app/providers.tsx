"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"

import { ApiError } from "@/shared/api/client"
import { ThemeProvider } from "@/shared/components/theme-provider"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { isDemo } from "@/shared/config"

/** App-wide providers. With no NEXT_PUBLIC_API_URL the in-browser mock API answers /api/* first. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // A 4xx (not found, no access, bad input) won't change on retry; network and 5xx errors get three tries.
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: (failures, error) => !(error instanceof ApiError && error.status < 500) && failures < 3 },
        },
      }),
  )
  const [ready, setReady] = useState(!isDemo)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!isDemo) return
    import("@/mocks/browser").then(async ({ worker }) => {
      // Service workers only run on https and localhost; on http://<LAN or WSL IP> the mock API can't start.
      if (!("serviceWorker" in navigator)) return setBlocked(true)
      await worker.start({ serviceWorker: { url: "/mockServiceWorker.js" }, onUnhandledFrame: "bypass", quiet: true })
      setReady(true)
    })
  }, [])

  // Tests and scripts wait for this: the app (and the mock backend, when used) is ready for requests.
  useEffect(() => {
    if (ready) document.documentElement.dataset.ready = "true"
  }, [ready])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {blocked ? (
            <p role="alert" className="p-6 text-sm">
              Mock API는 https 또는 localhost 주소에서만 동작합니다. 이 주소로 보려면 NEXT_PUBLIC_API_URL로 실제 API를
              연결하거나, localhost 또는 https 터널로 여세요.
            </p>
          ) : ready ? (
            children
          ) : null}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
