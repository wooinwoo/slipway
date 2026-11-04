"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/shared/components/theme-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { applyBrandHue, savedBrandHue } from "@/shared/lib/brand"
import { cn } from "@/shared/lib/utils"

const swatches = [262, 220, 168, 140, 45, 25, 350, 300]

/** Light/dark/system and the brand hue, saved in this browser. `defaultHue` matches --brand-h in index.css. */
export function ThemeSettings({ defaultHue = 262 }: { defaultHue?: number }) {
  const { theme, setTheme } = useTheme()
  const [hue, setHue] = useState(() => savedBrandHue() ?? defaultHue)

  const pickHue = (value: number) => {
    setHue(value)
    applyBrandHue(value === defaultHue ? null : value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>화면</CardTitle>
        <CardDescription>테마와 브랜드 색은 이 브라우저에 저장됩니다.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <ToggleGroup
          type="single"
          variant="outline"
          value={theme}
          onValueChange={(value) => value && setTheme(value as typeof theme)}
          className="w-fit"
        >
          <ToggleGroupItem value="light">
            <SunIcon />
            라이트
          </ToggleGroupItem>
          <ToggleGroupItem value="dark">
            <MoonIcon />
            다크
          </ToggleGroupItem>
          <ToggleGroupItem value="system">
            <MonitorIcon />
            시스템
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="grid gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">브랜드 색</span>
            <span className="font-mono text-xs text-muted-foreground">
              --brand-h: {hue}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {swatches.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`색상 ${value}`}
                aria-pressed={hue === value}
                onClick={() => pickHue(value)}
                className={cn(
                  "size-8 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                  hue === value && "ring-2 ring-foreground"
                )}
                style={{ background: `oklch(0.55 0.16 ${value})` }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={hue}
            onChange={(event) => pickHue(Number(event.target.value))}
            aria-label="브랜드 색상"
            className="w-full accent-primary"
          />
        </div>
      </CardContent>
    </Card>
  )
}
