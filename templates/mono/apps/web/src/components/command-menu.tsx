// ⌘K / Ctrl+K palette: jump to any page in the sidebar, switch theme.
// Add your own groups (search results, actions) inside <CommandList>.
import { useNavigate } from "@tanstack/react-router"
import { MoonIcon, SearchIcon, SettingsIcon, SunIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { nav } from "@/components/app-sidebar"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

export function CommandMenu() {
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
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  const pages = [...nav, { to: "/settings", label: "설정", icon: SettingsIcon }] as const

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={() => toggle(true)}>
        <SearchIcon />
        <span className="hidden sm:inline">이동</span>
        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={toggle} title="빠른 이동" description="페이지와 명령을 찾습니다">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder="페이지, 명령 검색" />
          <CommandList>
            <CommandEmpty>결과가 없습니다</CommandEmpty>
            <CommandGroup heading="페이지">
              {pages.map(({ to, label, icon: Icon }) => (
                <CommandItem key={to} value={label} onSelect={run(() => navigate({ to }))}>
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="명령">
              <CommandItem value={dark ? "라이트 모드" : "다크 모드"} onSelect={run(() => setTheme(dark ? "light" : "dark"))}>
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
