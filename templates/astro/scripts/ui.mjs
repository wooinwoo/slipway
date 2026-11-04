// pnpm shots [path ...]      screenshots only, into .shots/ (look at them before calling UI work done)
// pnpm check:ui [path ...]   the same pages, plus checks that fail the run (scripts/ui-checks.mjs):
//   accessibility and contrast (axe, WCAG 2.1 AA), sideways overflow, pointer cursor on clickables,
//   visible keyboard focus, console errors.
// Each page runs at desktop and mobile, light and dark. Without paths it takes every page in dist/.
// Serves the existing build; `pnpm shots` builds first, `pnpm verify` builds before checking.
import { spawn } from "node:child_process"
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { firefox } from "@playwright/test"

import { accessibilityIssues, cursorIssues, focusIssues, overflowIssues } from "./ui-checks.mjs"

const [mode, ...paths] = process.argv.slice(2)
if (mode !== "shots" && mode !== "check") throw new Error("usage: node scripts/ui.mjs shots|check [path ...]")
const PORT = 4399
const base = `http://localhost:${PORT}`
const out = ".shots"

function builtPages() {
  return readdirSync("dist", { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".html") && file !== "404.html")
    .map((file) => `/${file.replace(/\\/g, "/").replace(/index\.html$/, "").replace(/\.html$/, "")}`)
}

const pages = paths.length ? paths : builtPages()
mkdirSync(out, { recursive: true })
// Launch the package's JavaScript directly, including on Windows (no .cmd/shell wrapper).
const cliPackage = resolve("node_modules/astro/package.json")
const cliManifest = JSON.parse(readFileSync(cliPackage, "utf8"))
const cli = typeof cliManifest.bin === "string" ? cliManifest.bin : cliManifest.bin.astro
const server = spawn(process.execPath, [resolve(dirname(cliPackage), cli), ...["preview", "--port", String(PORT), "--ignore-lock"]], { stdio: "ignore" })
const failures = []

try {
  for (let i = 0; i < 50; i++) {
    if (await fetch(base).then(() => true, () => false)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  const browser = await firefox.launch()
  const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } }
  for (const scheme of ["light", "dark"]) {
    for (const [size, viewport] of Object.entries(sizes)) {
      const context = await browser.newContext({ viewport, colorScheme: scheme, locale: "ko-KR" })
      for (const path of pages) {
        const page = await context.newPage()
        const errors = []
        page.on("pageerror", (e) => errors.push(e.message))
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
        await page.goto(`${base}${path}`)
        await page.waitForLoadState("load")
        await page.evaluate(() => document.fonts.ready)
        const name = path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "root"
        await page.screenshot({ path: `${out}/${name}.${size}.${scheme}.png`, fullPage: true })
        if (mode === "check") {
          const where = `${path} ${size} ${scheme}`
          const issues = [
            ...(await accessibilityIssues(page)),
            ...(await overflowIssues(page)),
            ...(await cursorIssues(page)),
            ...(await focusIssues(page)),
            ...[...new Set(errors)].map((message) => `console error: ${message.slice(0, 200)}`),
          ]
          for (const issue of issues) failures.push(`${where}: ${issue}`)
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

console.log(`${pages.length * 4} screenshots in ${out}/ (${pages.join(" ")})`)
if (mode === "check") {
  writeFileSync(`${out}/ui-report.json`, JSON.stringify({ pages, failures }, null, 2) + "\n")
  if (failures.length) {
    console.error(`\nUI check failed (${failures.length}):\n  ${failures.join("\n  ")}`)
    process.exitCode = 1
  } else console.log("UI check passed: accessibility, contrast, overflow, cursor, focus and console errors.")
}
