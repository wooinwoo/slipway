// node scripts/sync-next.mjs
// Copies what the Next preset shares with templates/react, so the React preset stays the one source:
// shadcn components, Slipway parts, Korean helpers, the API client and auth hooks, the mock backend,
// the theme and the UI checks. Next-only files are hand-maintained in templates/next: src/app/,
// src/proxy.ts, src/config.ts, src/patterns/app-shell.tsx (next/link), scripts/ui.mjs, e2e/, configs.
// Every rewrite asserts its anchor, so drift in the React preset fails loudly.
import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const root = join(import.meta.dirname, "..", "templates")
const react = join(root, "react")
const next = join(root, "next")

const shared = [
  "src/components/ui",
  "src/components/form-field.tsx",
  "src/components/kr-inputs.tsx",
  "src/components/page-header.tsx",
  "src/components/theme-provider.tsx",
  "src/hooks",
  "src/lib",
  "src/patterns",
  "src/api/client.ts",
  "src/api/auth.ts",
  "src/mocks",
  "public/mockServiceWorker.js",
  "public/favicon.svg",
  "public/robots.txt",
  "scripts/ui-checks.mjs",
]
// Next has its own version of these.
const nextOnly = new Set(["src/patterns/app-shell.tsx"])

function files(path) {
  const full = join(react, path)
  if (statSync(full).isFile()) return [path]
  return readdirSync(full, { recursive: true }).map((f) => join(path, String(f))).filter((f) => statSync(join(react, f)).isFile())
}

// Components with state, effects or browser APIs run on the client in the App Router.
const clientDirs = ["src/components/", "src/patterns/", "src/hooks/"]

let count = 0
for (const file of shared.flatMap(files)) {
  if (nextOnly.has(file)) continue
  const from = join(react, file)
  const to = join(next, file)
  mkdirSync(dirname(to), { recursive: true })
  if (!/\.(ts|tsx)$/.test(file)) {
    cpSync(from, to)
    count++
    continue
  }
  let text = readFileSync(from, "utf8")
  text = text.replaceAll("import.meta.env.VITE_API_URL", "process.env.NEXT_PUBLIC_API_URL")
  if (clientDirs.some((dir) => file.startsWith(dir)) && !/^["']use client["']/.test(text)) text = `"use client"\n\n${text}`
  writeFileSync(to, text)
  count++
}

// Theme tokens: the React preset's src/index.css is the App Router's global stylesheet.
cpSync(join(react, "src/index.css"), join(next, "src/app/globals.css"))

// Design rules: same system, Next's way of naming pages.
{
  let text = readFileSync(join(react, "DESIGN.md"), "utf8")
  const pairs = [
    ["사이드바 메뉴와 Ctrl/⌘+K는 `AppShell`의 `nav` 하나로 같이 바뀐다. 라우트마다 `staticData.title`을 둔다.",
      "사이드바 메뉴와 Ctrl/⌘+K는 `AppShell`의 `nav` 하나로 같이 바뀐다. 페이지마다 `metadata.title`을 둔다."],
  ]
  for (const [anchor, replacement] of pairs) {
    if (!text.includes(anchor)) throw new Error(`templates/react/DESIGN.md: anchor not found:\n${anchor}`)
    text = text.replace(anchor, replacement)
  }
  writeFileSync(join(next, "DESIGN.md"), text)
}

console.log(`templates/next synced from templates/react (${count} files). Next: cd templates/next && pnpm verify`)
console.log(`  untouched, Next-only: src/app/, src/proxy.ts, src/config.ts, src/patterns/app-shell.tsx, scripts/ui.mjs`)
