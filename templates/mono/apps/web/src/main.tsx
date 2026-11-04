import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { RouteError, RouteNotFound, RoutePending } from "@/components/route-states"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isDemo } from "@/config"
import { applyBrandHue, savedBrandHue } from "@/lib/brand"
import { routeTree } from "./routeTree.gen"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  // Let React Query decide freshness; the router only triggers loads.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: () => <RouteNotFound />,
  Wrap: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
  interface StaticDataRouteOption {
    /** Shown in the app header breadcrumb. */
    title?: string
  }
}

async function enableMocks() {
  if (!isDemo) return
  // Service workers only run on https and localhost. On http://<LAN or WSL IP> the mock API can't
  // start, so say so instead of failing every request silently.
  if (!("serviceWorker" in navigator)) {
    document.getElementById("root")!.textContent =
      `Mock API는 https 또는 localhost 주소에서만 동작합니다. 지금 주소(${location.origin})로 보려면 ` +
      "VITE_API_URL로 실제 API를 연결하거나, localhost 또는 https 터널로 여세요."
    throw new Error("Mock API needs a secure context (https or localhost).")
  }
  const { worker } = await import("./mocks/browser")
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: "bypass",
    quiet: true,
  })
}

const hue = savedBrandHue()
if (hue !== null) applyBrandHue(hue)

enableMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </StrictMode>,
  )
  // Tests and scripts wait for this: the app (and the mock backend, when used) is ready for requests.
  document.documentElement.dataset.ready = "true"
})
