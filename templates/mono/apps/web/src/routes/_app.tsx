// REQ-4 앱 틀 (sidebar, breadcrumb, not-found inside the app)
// REQ-5 빠른 이동 (CommandMenu in the header)
import { Link, Outlet, createFileRoute, redirect, useMatches } from "@tanstack/react-router"
import { Fragment } from "react"

import { meQuery } from "@/api/auth"
import { token } from "@/api/client"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandMenu } from "@/components/command-menu"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { codepack, isDemo } from "@/config"

// Every route under src/routes/_app/ requires a signed-in user.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null)
    if (!user) {
      token.clear()
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
    return { user }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-center" />
          <Crumbs />
          <div className="ml-auto flex items-center gap-2">
            {isDemo && codepack.showEnvironment && (
              <Badge variant="secondary" className="hidden font-normal sm:inline-flex">
                Mock API
              </Badge>
            )}
            <CommandMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Built from each matched route's `staticData.title`. */
function Crumbs() {
  const crumbs = useMatches({
    select: (matches) => matches.filter((m) => m.staticData.title).map((m) => ({ title: m.staticData.title!, path: m.pathname })),
  })
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.path}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
