import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router"
import { ChevronsUpDownIcon, HouseIcon, LogOutIcon, MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from "lucide-react"

import { meQuery, useLogout } from "@/api/auth"
import { Logo } from "@/components/logo"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar"
import { isDemo } from "@/config"

// Add a page: create the route file under src/routes/_app/, then add one line here.
// The command menu (Ctrl+K) lists the same pages.
export const nav = [
  { to: "/home", label: "홈", icon: HouseIcon },
  // gen:nav
] as const

export function AppSidebar() {
  const matchRoute = useMatchRoute()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/home">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...nav, { to: "/settings", label: "설정", icon: SettingsIcon } as const].map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild tooltip={label} isActive={Boolean(matchRoute({ to, fuzzy: true }))}>
                    <Link to={to}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isDemo && (
          <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
            <div className="rounded-lg border bg-background/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Mock API</p>
              서버 없이 브라우저 안에서 동작합니다. 데이터는 이 브라우저에만 저장됩니다.
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function UserMenu() {
  const { data: user } = useSuspenseQuery(meQuery)
  const { theme, setTheme } = useTheme()
  const logout = useLogout()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">{user.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">화면</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
              <DropdownMenuRadioItem value="light"><SunIcon />라이트</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark"><MoonIcon />다크</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system"><MonitorIcon />시스템 설정</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) })}>
              <LogOutIcon />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
