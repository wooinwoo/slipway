import type { QueryClient } from "@tanstack/react-query"
import { Outlet, createRootRouteWithContext, useMatches } from "@tanstack/react-router"
import { useEffect } from "react"

import { RouteNotFound } from "@/shared/components/route-states"
import { product } from "@/shared/config"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Root,
  notFoundComponent: () => (
    <div className="flex min-h-svh items-center justify-center">
      <RouteNotFound />
    </div>
  ),
})

function Root() {
  // The deepest route with `staticData.title` names the browser tab.
  const title = useMatches({ select: (matches) => matches.findLast((m) => m.staticData.title)?.staticData.title })
  useEffect(() => {
    document.title = title ? `${title} · ${product.name}` : `${product.name} · ${product.tagline}`
  }, [title])
  return <Outlet />
}
