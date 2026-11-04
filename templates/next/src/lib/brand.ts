// Live brand hue, so a demo can be re-colored for a client in seconds (Settings > 브랜드 색).
const KEY = "slipway.brand-h"

export function applyBrandHue(hue: number | null) {
  const root = document.documentElement.style
  if (hue === null) {
    root.removeProperty("--brand-h")
    localStorage.removeItem(KEY)
    return
  }
  root.setProperty("--brand-h", String(hue))
  localStorage.setItem(KEY, String(hue))
}

export function savedBrandHue() {
  const saved = localStorage.getItem(KEY)
  return saved === null ? null : Number(saved)
}
