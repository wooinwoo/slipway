// REQ-6 설정
import { createFileRoute } from "@tanstack/react-router"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/page-header"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { applyBrandHue, savedBrandHue } from "@/lib/brand"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_app/settings")({
  staticData: { title: "설정" },
  component: SettingsPage,
})

const DEFAULT_HUE = 262
const swatches = [262, 220, 168, 140, 45, 25, 350, 300]
const providerLabel = { email: "이메일", guest: "게스트", kakao: "카카오", naver: "네이버" }

function SettingsPage() {
  const { user } = Route.useRouteContext()
  const { theme, setTheme } = useTheme()
  const [hue, setHue] = useState(savedBrandHue() ?? DEFAULT_HUE)

  const pickHue = (value: number) => {
    setHue(value)
    applyBrandHue(value === DEFAULT_HUE ? null : value)
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="설정" />

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary">{providerLabel[user.provider]} 로그인</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>화면</CardTitle>
          <CardDescription>테마와 브랜드 색은 이 브라우저에 저장됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <ToggleGroup type="single" variant="outline" value={theme} onValueChange={(v) => v && setTheme(v as typeof theme)} className="w-fit">
            <ToggleGroupItem value="light"><SunIcon />라이트</ToggleGroupItem>
            <ToggleGroupItem value="dark"><MoonIcon />다크</ToggleGroupItem>
            <ToggleGroupItem value="system"><MonitorIcon />시스템</ToggleGroupItem>
          </ToggleGroup>

          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">브랜드 색</span>
              <span className="font-mono text-xs text-muted-foreground">--brand-h: {hue}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {swatches.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`색상 ${value}`}
                  onClick={() => pickHue(value)}
                  className={cn("size-8 rounded-full ring-offset-2 ring-offset-background transition-shadow", hue === value && "ring-2 ring-foreground")}
                  style={{ background: `oklch(0.55 0.16 ${value})` }}
                />
              ))}
            </div>
            <Slider min={0} max={360} step={1} value={[hue]} onValueChange={([value]) => pickHue(value)} aria-label="브랜드 색상" />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
