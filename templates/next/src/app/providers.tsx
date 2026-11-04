"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isDemo } from "@/config"

/** App-wide providers. With no NEXT_PUBLIC_API_URL the in-browser mock API answers /api/* first. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }),
  )
  const [ready, setReady] = useState(!isDemo)

  useEffect(() => {
    if (!isDemo) return
    import("@/mocks/browser")
      .then(({ worker }) =>
        worker.start({ serviceWorker: { url: "/mockServiceWorker.js" }, onUnhandledFrame: "bypass", quiet: true }),
      )
      .then(() => setReady(true))
  }, [])

  // Tests and scripts wait for this: the app (and the mock backend, when used) is ready for requests.
  useEffect(() => {
    if (ready) document.documentElement.dataset.ready = "true"
  }, [ready])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {ready ? children : null}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
