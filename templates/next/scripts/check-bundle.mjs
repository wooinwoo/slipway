// pnpm check:bundle (runs after `pnpm build` in `pnpm verify`)
// Fails when a page's first load grows past its budget, measured gzipped like a browser downloads it:
//   initial JS:  the framework runtime plus the root layout's and the page's own client chunks
//   initial CSS: the stylesheets those load
// Change the limits in package.json under "slipway.budget" (KB, gzipped) when a feature truly needs it.
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { runInNewContext } from "node:vm"
import { gzipSync } from "node:zlib"

const out = ".next"
// Next.js and React's client runtime alone is about 120 KB of the JS budget.
const defaults = { initialJs: 300, initialCss: 60 }
const budget = { ...defaults, ...JSON.parse(readFileSync("package.json", "utf8")).slipway?.budget }
const kb = (file) => gzipSync(readFileSync(join(out, file))).length / 1024
const build = JSON.parse(readFileSync(join(out, "build-manifest.json"), "utf8"))
const runtime = [...build.polyfillFiles, ...build.rootMainFiles]

// Each app page has a client reference manifest naming the chunks its layout and page load.
const manifests = readdirSync(join(out, "server/app"), { recursive: true })
  .map(String)
  .filter((file) => file.endsWith("page_client-reference-manifest.js"))

const rows = []
for (const file of manifests) {
  const context = { globalThis: { __RSC_MANIFEST: {} } }
  runInNewContext(readFileSync(join(out, "server/app", file), "utf8"), context)
  const [[page, manifest]] = Object.entries(context.globalThis.__RSC_MANIFEST)
  if (page.includes("_not-found") || page.includes("_global-error")) continue
  const entries = Object.entries(manifest.entryJSFiles ?? {}).filter(([key]) => key.endsWith("/layout") || key.endsWith("/page"))
  const js = new Set([...runtime, ...entries.flatMap(([, files]) => files)])
  const css = new Set(
    Object.entries(manifest.entryCSSFiles ?? {})
      .filter(([key]) => key.endsWith("/layout") || key.endsWith("/page"))
      .flatMap(([, files]) => files.map((f) => (typeof f === "string" ? f : f.path))),
  )
  const route = page.replace(/\/page$/, "") || "/"
  rows.push([`${route} JS`, [...js].reduce((sum, f) => sum + kb(f), 0), budget.initialJs])
  rows.push([`${route} CSS`, [...css].reduce((sum, f) => sum + kb(f), 0), budget.initialCss])
}

for (const [name, size, limit] of rows) {
  console.log(`${size > limit ? "✗" : "✓"} ${name.padEnd(32)} ${size.toFixed(1).padStart(7)} KB / ${limit} KB`)
}
if (!rows.length) {
  console.error("No pages found in .next. Run `pnpm build` first.")
  process.exitCode = 1
} else if (rows.some(([, size, limit]) => size > limit)) {
  console.error(`\nBundle budget exceeded. Lazy-load the heavy part (next/dynamic, a dynamic import), drop the dependency,\nor raise "slipway.budget" in package.json with a reason.`)
  process.exitCode = 1
} else console.log("Bundle within budget (gzipped).")
