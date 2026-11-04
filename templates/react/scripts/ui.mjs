// pnpm shots [route ...]      screenshots only, into .shots/ (look at them before calling UI work done)
// pnpm check:ui [route ...]   the same pages, plus checks that fail the run (scripts/ui-checks.mjs):
//   - accessibility (axe, WCAG 2.1 A/AA, serious and critical issues), which includes color contrast
//   - horizontal overflow of the page at desktop (1440) and mobile (390) widths
//   - the pointer cursor on everything clickable, and a visible keyboard focus on every Tab stop
//   - runtime errors in the console
// pnpm design:compare <route>=<screen.html> ...
//   each app route next to the design harness's screen at phone size, into .shots/compare-<screen>.png.
//   `--signed-out <route>` opens that route without a session (sign-in screens).
//   `--now <date-time>` freezes the clock for any mode. `--design <dir>` is the harness's screens folder (default: out/screens here or two folders up).
// Each route runs at desktop and mobile, light and dark. Without routes it takes every static route in
// src/routeTree.gen.ts. Routes behind a login are opened as the demo account when the backend has it
// (src/mocks/db.ts seeds it, so its rows are what the screens show), otherwise as a guest
// (POST /api/auth/guest). Serves an existing build: `--dist dist-demo` picks another output folder.
import { spawn } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { firefox } from "@playwright/test"

import { accessibilityIssues, cursorIssues, focusIssues, overflowIssues } from "./ui-checks.mjs"

const args = process.argv.slice(2)
const mode = args.shift()
if (!["shots", "check", "compare"].includes(mode))
  throw new Error("usage: node scripts/ui.mjs shots|check [--dist dir] [route ...] | compare [--dist dir] [--design dir] <route>=<screen.html> ...")
const option = (name, fallback) => {
  const at = args.indexOf(name)
  return at >= 0 ? args.splice(at, 2)[1] : fallback
}
// Project settings for these checks live under "slipway" in package.json.
const config = JSON.parse(readFileSync("package.json", "utf8")).slipway ?? {}
const dist = option("--dist", "dist")
// `--now 2026-11-04T18:50` (or SLIPWAY_NOW, or "slipway.now" in package.json) freezes the page clock, so
// time-based copy matches the design's moment.
const now = option("--now", process.env.SLIPWAY_NOW ?? config.now)
// `--signed-out /login` (repeatable): routes compare opens without a session, like a sign-in screen.
const signedOut = []
for (let at = args.indexOf("--signed-out"); at >= 0; at = args.indexOf("--signed-out")) signedOut.push(args.splice(at, 2)[1])
const design = option("--design", ["out/screens", "../../out/screens"].find((dir) => existsSync(dir)))
const PORT = 5199
const base = `http://localhost:${PORT}`
const out = ".shots"

function staticRoutes() {
  const tree = readFileSync("src/routeTree.gen.ts", "utf8")
  const block = /export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/.exec(tree)?.[1] ?? ""
  return [...block.matchAll(/^\s+['"]([^'"]+)['"]:/gm)]
    .map((m) => m[1])
    .map((route) => (route.length > 1 ? route.replace(/\/$/, "") : route))
    .filter((route) => !route.includes("$") && route !== "/auth/callback")
}

if (mode === "compare" && (!design || !existsSync(design))) throw new Error("No harness screens: pass --design <dir> (k-style writes out/screens).")
if (mode === "compare" && (!args.length || args.some((pair) => !/^\/.*=[^=/]+\.html$/.test(pair))))
  throw new Error("usage: pnpm design:compare /today=today.html /classes=classes.html ...")
// Routes with parameters aren't in the route tree: list them (demo account ids) under "slipway.routes" in package.json.
const listed = config.routes ?? []
// Routes seen before signing in (a sign-in screen): `"slipway": { "signedOut": ["/login"] }` or --signed-out.
signedOut.push(...(config.signedOut ?? []))
const routes = args.length ? args : [...new Set([...staticRoutes(), ...listed])]
// check:ui reads the last build: say so when the source changed after it.
{
  const built = existsSync(join(dist, "index.html")) ? statSync(join(dist, "index.html")).mtimeMs : 0
  const newest = Math.max(...readdirSync("src", { recursive: true }).map((file) => statSync(join("src", String(file))).mtimeMs))
  if (built && newest > built) console.log(`note: src changed after the build in ${dist}/; rebuild first (pnpm build) or this checks the old app`)
}
// The demo account the app and mock share (src/api/demo-account.ts).
const demo = (() => {
  const source = existsSync("src/api/demo-account.ts") ? readFileSync("src/api/demo-account.ts", "utf8") : ""
  const found = /demoAccount = \{ email: "([^"]+)", password: "([^"]+)" \}/.exec(source)
  return found ? { email: found[1], password: found[2] } : { email: "demo@slipway.dev", password: "demo1234" }
})()
mkdirSync(out, { recursive: true })
const lightOnly = readFileSync("src/index.css", "utf8").includes("@custom-variant dark (&:not(*))")
const server = spawn("pnpm", ["exec", "vite", "preview", "--outDir", dist, "--port", String(PORT), "--strictPort"], { stdio: "ignore" })
const failures = []
const notes = []

try {
  for (let i = 0; i < 50; i++) {
    if (await fetch(base).then(() => true, () => false)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  // Firefox: headless Chromium renders no frames on some WSL setups.
  // ko-KR for the browser UI too, so <input type="date|time"> draws Korean formats like a Korean phone.
  const browser = await firefox.launch({ firefoxUserPrefs: { "intl.locale.requested": "ko-KR", "intl.accept_languages": "ko-KR, ko" } })
  if (mode === "compare") {
    await compare(browser)
    process.exit(0)
  }
  const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } }
  for (const scheme of lightOnly ? ["light"] : ["light", "dark"]) {
    for (const [size, viewport] of Object.entries(sizes)) {
      const context = await browser.newContext({ viewport, colorScheme: scheme, locale: "ko-KR" })
      if (now) await context.clock.setFixedTime(new Date(now))
      // Sign in once per context so routes under a login guard render their real screen.
      const start = await context.newPage()
      await start.goto(base)
      await start.locator('html[data-ready="true"]').waitFor()
      const token = await signIn(start)
      const anonymous = await browser.newContext({ viewport, colorScheme: scheme, locale: "ko-KR" })
      if (now) await anonymous.clock.setFixedTime(new Date(now))
      if (!token && scheme === "light" && size === "desktop") notes.push("guest sign-in unavailable: guarded routes show their redirect target")
      await start.close()

      for (const route of routes) {
        // A fresh tab per route: Firefox aborts a goto that follows another while the mock worker runs.
        const page = await (signedOut.includes(route) ? anonymous : context).newPage()
        const errors = []
        page.on("pageerror", (e) => errors.push(e.message))
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
        await page.goto(`${base}${route}`)
        await page.waitForLoadState("networkidle")
        const name = route.replace(/^\//, "").replace(/\//g, "-") || "root"
        const where = `${route} ${size} ${scheme}`
        await page.screenshot({ path: `${out}/${name}.${size}.${scheme}.png`, fullPage: true })
        if (new URL(page.url()).pathname !== new URL(route, base).pathname) notes.push(`${where}: shown at ${new URL(page.url()).pathname}`)

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
      await anonymous.close()
    }
  }
  await browser.close()
} finally {
  server.kill()
}

console.log(`${routes.length * (lightOnly ? 2 : 4)} screenshots in ${out}/ (${routes.join(" ")})`)
for (const note of new Set(notes)) console.log(`note: ${note}`)
if (mode === "check") {
  writeFileSync(`${out}/ui-report.json`, JSON.stringify({ routes, failures, notes: [...new Set(notes)] }, null, 2) + "\n")
  if (failures.length) {
    console.error(`\nUI check failed (${failures.length}):\n  ${failures.join("\n  ")}`)
    process.exitCode = 1
  } else console.log("UI check passed: accessibility, contrast, overflow, cursor, focus and console errors.")
}

/** Signs the page's origin in: the seeded demo account first, a fresh guest otherwise. */
async function signIn(page) {
  return page.evaluate(async (demo) => {
    const post = (path, json) =>
      fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: json && JSON.stringify(json) })
        .then((r) => (r.ok ? r.json() : null), () => null)
    const body = (await post("/api/auth/login", demo)) ?? (await post("/api/auth/guest"))
    if (body?.token) localStorage.setItem("slipway.token", body.token)
    return body?.token ?? null
  }, demo)
}

/** Phone-size capture of the whole page: the viewport grows to the content so pinned bars sit at the end. */
async function capture(page) {
  await page.waitForTimeout(300)
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: 375, height: Math.max(812, height) })
  await page.waitForTimeout(200)
  return (await page.screenshot()).toString("base64")
}

async function compare(browser) {
  const open = async (signed) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: "ko-KR" })
    if (now) await context.clock.setFixedTime(new Date(now))
    if (!signed) return context
    const start = await context.newPage()
    await start.goto(base)
    await start.locator('html[data-ready="true"]').waitFor()
    if (!(await signIn(start))) console.log("note: sign-in unavailable: guarded routes show their redirect target")
    await start.close()
    return context
  }
  const contexts = { in: await open(true), out: await open(false) }
  for (const pair of routes) {
    // The route may carry a query (`/new?classId=1`): the screen is after the last "=".
    const route = pair.slice(0, pair.lastIndexOf("=")), screen = pair.slice(pair.lastIndexOf("=") + 1)
    const context = signedOut.includes(route) ? contexts.out : contexts.in
    const app = await context.newPage()
    await app.goto(`${base}${route}`)
    await app.waitForLoadState("networkidle")
    const shown = await capture(app)
    await app.close()
    const harness = await context.newPage()
    await harness.goto(pathToFileURL(resolve(join(design, screen))).href)
    await harness.waitForLoadState("load")
    const drawn = await capture(harness)
    await harness.close()
    const sheet = await context.newPage()
    await sheet.setViewportSize({ width: 375 * 2 + 72, height: 400 })
    await sheet.setContent(`<body style="margin:0;padding:16px;display:flex;gap:40px;align-items:flex-start;background:#777;font:600 14px sans-serif;color:#fff">
      <figure style="margin:0"><figcaption style="margin-bottom:8px">디자인 ${screen}</figcaption><img src="data:image/png;base64,${drawn}"></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:8px">앱 ${route}</figcaption><img src="data:image/png;base64,${shown}"></figure></body>`)
    const file = `${out}/compare-${screen.replace(/\.html$/, "")}.png`
    await sheet.screenshot({ path: file, fullPage: true })
    await sheet.close()
    console.log(`${file}: ${route} next to ${screen}`)
  }
  await contexts.in.close()
  await contexts.out.close()
  await browser.close()
  server.kill()
}
