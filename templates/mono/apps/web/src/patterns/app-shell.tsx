import {
  Link,
  useMatchRoute,
  useMatches,
  useNavigate,
  type LinkProps,
} from "@tanstack/react-router"
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react"
import {
  Fragment,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Breadcrumb and browser tab title for the route. */
    title?: string
  }
}

export type NavItem = {
  to: NonNullable<LinkProps["to"]>
  label: string
  /** Any icon component: lucide-react (installed), Tabler, Phosphor, Heroicons... */
  icon: ComponentType<{ className?: string }>
}
export type ShellUser = { name: string; email: string }

/**
 * Sidebar, header breadcrumb and Ctrl/⌘+K around a page. Put it in a layout route:
 * `<AppShell brand="이름" nav={nav}><Outlet /></AppShell>`. Breadcrumbs come from each
 * matched route's `staticData.title`.
 */
export function AppShell({
  brand,
  nav,
  user,
  onLogout,
  actions,
  children,
}: {
  brand: string
  nav: readonly NavItem[]
  user?: ShellUser | null
  onLogout?: () => void
  /** Header content left of the ⌘K button: status badges, buttons. */
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="pointer-events-none">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {brand.slice(0, 1)}
                </span>
                <span className="truncate font-semibold tracking-tight">
                  {brand}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>메뉴</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu nav={nav} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {user && (
          <SidebarFooter>
            <UserMenu user={user} onLogout={onLogout} />
          </SidebarFooter>
        )}
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-center"
          />
          <RouteCrumbs />
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <CommandMenu nav={nav} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function NavMenu({ nav }: { nav: readonly NavItem[] }) {
  const matchRoute = useMatchRoute()
  // On phones the sidebar is a sheet over the page; close it once a page is picked.
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenu>
      {nav.map(({ to, label, icon: Icon }) => (
        <SidebarMenuItem key={to}>
          <SidebarMenuButton
            asChild
            tooltip={label}
            isActive={!!matchRoute({ to, fuzzy: true })}
          >
            <Link to={to} onClick={() => setOpenMobile(false)}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function RouteCrumbs() {
  const crumbs = useMatches({
    select: (matches) =>
      matches
        .filter((match) => match.staticData.title)
        .map((match) => ({ title: match.staticData.title!, path: match.pathname })),
  })
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.path}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === crumbs.length - 1 ? (
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

function UserMenu({ user, onLogout }: { user: ShellUser; onLogout?: () => void }) {
  const { theme, setTheme } = useTheme()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {user.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              화면
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as typeof theme)}
            >
              <DropdownMenuRadioItem value="light">
                <SunIcon />
                라이트
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon />
                다크
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon />
                시스템 설정
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {onLogout && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>
                  <LogOutIcon />
                  로그아웃
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

function CommandMenu({ nav }: { nav: readonly NavItem[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
        setQuery("")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Every open starts with an empty search.
  const toggle = (value: boolean) => {
    setOpen(value)
    if (!value) setQuery("")
  }
  const run = (action: () => void) => () => {
    toggle(false)
    action()
  }
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => toggle(true)}
      >
        <SearchIcon />
        <span className="sr-only sm:not-sr-only">이동</span>
        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={toggle}
        title="빠른 이동"
        description="페이지와 명령을 찾습니다"
      >
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="페이지, 명령 검색"
          />
          <CommandList>
            <CommandEmpty>결과가 없습니다</CommandEmpty>
            <CommandGroup heading="페이지">
              {nav.map(({ to, label, icon: Icon }) => (
                <CommandItem
                  key={to}
                  value={label}
                  onSelect={run(() => navigate({ to }))}
                >
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="명령">
              <CommandItem
                value={dark ? "라이트 모드" : "다크 모드"}
                onSelect={run(() => setTheme(dark ? "light" : "dark"))}
              >
                {dark ? <SunIcon /> : <MoonIcon />}
                {dark ? "라이트 모드로" : "다크 모드로"}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
