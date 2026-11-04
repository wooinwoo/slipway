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
