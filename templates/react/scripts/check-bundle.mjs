// pnpm check:bundle (runs after `pnpm build` in `pnpm verify`)
// Fails when the production build grows past its budget, measured gzipped like a browser downloads it:
//   initial: the JS and CSS that index.html loads before the first screen
//   chunk:   any one lazily loaded file (a route, the mock backend)
// Change the limits in package.json under "slipway.budget" (KB, gzipped) when a feature truly needs it.
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

const dist = "dist"
const defaults = { initialJs: 200, initialCss: 60, chunk: 250 }
const budget = { ...defaults, ...JSON.parse(readFileSync("package.json", "utf8")).slipway?.budget }
const kb = (file) => gzipSync(readFileSync(join(dist, file))).length / 1024

const html = readFileSync(join(dist, "index.html"), "utf8")
const initial = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])
const assets = readdirSync(join(dist, "assets")).filter((f) => /\.(js|css)$/.test(f)).map((f) => `assets/${f}`)

const sum = (ext) => initial.filter((f) => f.endsWith(ext)).reduce((total, f) => total + kb(f), 0)
const rows = [
  ["initial JS", sum(".js"), budget.initialJs],
  ["initial CSS", sum(".css"), budget.initialCss],
  ...assets.filter((f) => !initial.includes(f)).map((f) => [f, kb(f), budget.chunk]),
]

const over = rows.filter(([, size, limit]) => size > limit)
for (const [name, size, limit] of rows.toSorted((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`${size > limit ? "✗" : "✓"} ${name.padEnd(40)} ${size.toFixed(1).padStart(7)} KB / ${limit} KB`)
}
if (over.length) {
  console.error(`\nBundle budget exceeded. Lazy-load the heavy part (a route or dynamic import), drop the dependency,\nor raise "slipway.budget" in package.json with a reason.`)
  process.exitCode = 1
} else console.log(`Bundle within budget (gzipped).`)
