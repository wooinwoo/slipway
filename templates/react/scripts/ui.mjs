// pnpm shots [route ...]      screenshots only, into .shots/ (look at them before calling UI work done)
// pnpm check:ui [route ...]   the same pages, plus checks that fail the run (scripts/ui-checks.mjs):
//   - accessibility (axe, WCAG 2.1 A/AA, serious and critical issues), which includes color contrast
//   - horizontal overflow of the page at desktop (1440) and mobile (390) widths
//   - the pointer cursor on everything clickable, and a visible keyboard focus on every Tab stop
//   - runtime errors in the console
// Each route runs at desktop and mobile, light and dark. Without routes it takes every static route in
// src/routeTree.gen.ts. Routes behind a login are opened as a guest (POST /api/auth/guest), which works
// on the mock backend. Serves an existing build: `--dist dist-demo` picks another output folder.
import { spawn } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { firefox } from "@playwright/test"

import { accessibilityIssues, cursorIssues, focusIssues, overflowIssues } from "./ui-checks.mjs"

const args = process.argv.slice(2)
const mode = args.shift()
if (mode !== "shots" && mode !== "check") throw new Error("usage: node scripts/ui.mjs shots|check [--dist dir] [route ...]")
const distAt = args.indexOf("--dist")
const dist = distAt >= 0 ? args.splice(distAt, 2)[1] : "dist"
const PORT = 5199
const base = `http://localhost:${PORT}`
const out = ".shots"

function staticRoutes() {
  const tree = readFileSync("src/routeTree.gen.ts", "utf8")
  const block = /export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/.exec(tree)?.[1] ?? ""
  return [...block.matchAll(/^\s+['"]([^'"]+)['"]:/gm)]
    .map((m) => m[1])
    .filter((route) => !route.includes("$") && route !== "/auth/callback")
}

const routes = args.length ? args : staticRoutes()
mkdirSync(out, { recursive: true })
const server = spawn("pnpm", ["exec", "vite", "preview", "--outDir", dist, "--port", String(PORT), "--strictPort"], { stdio: "ignore" })
const failures = []
const notes = []

try {
  for (let i = 0; i < 50; i++) {
    if (await fetch(base).then(() => true, () => false)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  // Firefox: headless Chromium renders no frames on some WSL setups.
  const browser = await firefox.launch()
  const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } }
  for (const scheme of ["light", "dark"]) {
    for (const [size, viewport] of Object.entries(sizes)) {
      const context = await browser.newContext({ viewport, colorScheme: scheme, locale: "ko-KR" })
      // Sign in once per context so routes under a login guard render their real screen.
      const start = await context.newPage()
      await start.goto(base)
      await start.locator('html[data-ready="true"]').waitFor()
      const token = await start.evaluate(async () => {
        const response = await fetch("/api/auth/guest", { method: "POST" }).catch(() => null)
        const body = response?.ok ? await response.json() : null
        if (body?.token) localStorage.setItem("slipway.token", body.token)
        return body?.token ?? null
      })
      if (!token && scheme === "light" && size === "desktop") notes.push("guest sign-in unavailable: guarded routes show their redirect target")
      await start.close()

      for (const route of routes) {
        // A fresh tab per route: Firefox aborts a goto that follows another while the mock worker runs.
        const page = await context.newPage()
        const errors = []
        page.on("pageerror", (e) => errors.push(e.message))
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
        await page.goto(`${base}${route}`)
        await page.waitForLoadState("networkidle")
        const name = route.replace(/^\//, "").replace(/\//g, "-") || "root"
        const where = `${route} ${size} ${scheme}`
        await page.screenshot({ path: `${out}/${name}.${size}.${scheme}.png`, fullPage: true })
        if (new URL(page.url()).pathname !== route) notes.push(`${where}: shown at ${new URL(page.url()).pathname}`)

        if (mode === "check") {
          const issues = [
            ...(await accessibilityIssues(page)),
            ...(await overflowIssues(page)),
            ...(await cursorIssues(page)),
            ...(await focusIssues(page)),
          ]
          for (const issue of issues) failures.push(`${where}: ${issue}`)
          for (const message of new Set(errors)) failures.push(`${where}: console error: ${message.slice(0, 200)}`)
        }
        await page.close()
      }
      await context.close()
    }
  }
  await browser.close()
} finally {
  server.kill()
}

console.log(`${routes.length * 4} screenshots in ${out}/ (${routes.join(" ")})`)
for (const note of new Set(notes)) console.log(`note: ${note}`)
if (mode === "check") {
  writeFileSync(`${out}/ui-report.json`, JSON.stringify({ routes, failures, notes: [...new Set(notes)] }, null, 2) + "\n")
  if (failures.length) {
    console.error(`\nUI check failed (${failures.length}):\n  ${failures.join("\n  ")}`)
    process.exitCode = 1
  } else console.log("UI check passed: accessibility, contrast, overflow, cursor, focus and console errors.")
}
