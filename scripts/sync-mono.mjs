// node scripts/sync-mono.mjs
// Rebuilds templates/mono from the standalone presets, so there is one source of truth:
//   templates/react  -> mono/apps/web
//   templates/nest   -> mono/apps/api
//   shared code      -> mono/packages/shared/src (Korean helpers from react, auth contract from nest)
// Hand-maintained mono files (root package.json, turbo.json, AGENTS.md, shared package.json and
// tsconfig) are left alone. Every patch asserts its anchor, so drift in a preset fails loudly.
import { cpSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { basename, join, relative } from "node:path"

const root = join(import.meta.dirname, "..", "templates")
const mono = join(root, "mono")
const skip = new Set(["node_modules", "dist", "dist-demo", "test-results", "playwright-report", ".tanstack", ".shots", ".data", ".turbo", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".env", "Dockerfile", ".dockerignore", ".github", ".lighthouseci"])

function copy(from, to) {
  // Preserve dependencies, databases and local settings in existing checkouts.
  cpSync(from, to, {
    recursive: true,
    filter: (src) => {
      const entry = basename(src)
      return !skip.has(entry) && !entry.endsWith(".tsbuildinfo")
        && !(entry.startsWith(".env") && entry !== ".env.example")
    },
  })
}

function patch(file, ...pairs) {
  let text = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
  for (let i = 0; i < pairs.length; i += 2) {
    if (!text.includes(pairs[i])) throw new Error(`${relative(mono, file)}: anchor not found:\n${pairs[i]}`)
    text = text.replace(pairs[i], pairs[i + 1])
  }
  writeFileSync(file, text)
}

function json(file, edit) {
  const data = JSON.parse(readFileSync(file, "utf8"))
  edit(data)
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n")
}

const web = join(mono, "apps/web")
const api = join(mono, "apps/api")
const shared = join(mono, "packages/shared/src")

copy(join(root, "react"), web)
copy(join(root, "nest"), api)
cpSync(join(root, "react/src/lib/kr.ts"), join(shared, "kr.ts"))
cpSync(join(root, "react/src/lib/kr.test.ts"), join(shared, "kr.test.ts"))
cpSync(join(root, "nest/src/contracts/auth.ts"), join(shared, "auth.ts"))
writeFileSync(join(shared, "index.ts"), 'export * from "./auth.js"\nexport * from "./kr.js"\n')
patch(join(shared, "auth.ts"),
  "// Request/response shapes shared with the web app. Keep in sync with\n// templates/react/src/api/auth.ts (in the mono preset both import one package).\n",
  "// Request/response shapes both apps agree on.\n")

// --- web
writeFileSync(join(web, "src/lib/kr.ts"), '// Korean helpers live in packages/shared so the API validates with the same rules.\nexport * from "@slipway/shared/kr"\n')
unlinkSync(join(web, "src/lib/kr.test.ts"))
patch(join(web, "src/api/auth.ts"),
  'import { z } from "zod"\n\nimport { isDemo } from "@/config"\nimport { ApiError, api, BASE_URL, token } from "./client"\nimport { demoAccount } from "./demo-account"\n\nexport { demoAccount }\n\nexport type User = { id: string; name: string; email: string; provider: "email" | "guest" | "kakao" | "naver" }\n',
  'import type { z } from "zod"\n\nimport { loginSchema, signupSchema, type User } from "@slipway/shared/auth"\nimport { isDemo } from "@/config"\nimport { ApiError, api, BASE_URL, token } from "./client"\nimport { demoAccount } from "./demo-account"\n\nexport { demoAccount }\nexport { loginSchema, signupSchema, type User }\n')
{
  const file = join(web, "src/api/auth.ts")
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
  const start = text.indexOf("export const loginSchema")
  const end = text.indexOf("export const meQuery")
  if (start < 0 || end < 0) throw new Error("apps/web/src/api/auth.ts: schema block not found")
  writeFileSync(file, text.slice(0, start) + text.slice(end))
}
json(join(web, "package.json"), (pkg) => {
  pkg.name = "@slipway/web"
  pkg.dependencies["@slipway/shared"] = "workspace:*"
  pkg.scripts["dev:demo"] = "vite --mode demo"
  pkg.scripts.test = "vitest run --passWithNoTests"
  pkg.scripts["build:demo"] = "tsc -b && vite build --mode demo --outDir dist-demo"
  pkg.scripts["e2e:demo"] = "pnpm build:demo && playwright test --config playwright.demo.config.ts"
  // UI checks, screenshots and the web score use the mock build, which needs no API running.
  pkg.scripts.verify = pkg.scripts.verify.replace(" && pnpm check:ui", "") + " && pnpm e2e:demo && pnpm check:ui"
  pkg.scripts["check:ui"] = "node scripts/ui.mjs check --dist dist-demo"
  pkg.scripts.shots = "pnpm build:demo && node scripts/ui.mjs shots --dist dist-demo"
  pkg.scripts["design:compare"] = "pnpm build:demo && node scripts/ui.mjs compare --dist dist-demo"
  // Hand over the built mock app: one bundle, so it opens in a second (the dev server serves hundreds of files).
  pkg.scripts["preview:demo"] = "vite preview --outDir dist-demo --host"
  pkg.scripts["check:score"] = "LHCI_DIST=dist-demo npx --yes @lhci/cli@0.16.0 autorun --config=lighthouserc.cjs"
})
if (!existsSync(join(web, ".env"))) writeFileSync(join(web, ".env"), "# In the monorepo the web app talks to apps/api on the same origin (Vite proxies /api in dev and preview).\n# `pnpm dev:demo` runs it on the in-browser mock instead.\nVITE_API_URL=/\n")
writeFileSync(join(web, ".env.demo"), "VITE_API_URL=\n")
patch(join(web, ".gitignore"), "\n# Playwright", "\n# Committed on purpose: they hold no secrets, only where the API lives.\n!.env\n!.env.demo\n\n# Playwright")
patch(join(web, "vite.config.ts"),
  '      "@": resolve(import.meta.dirname, "./src"),\n    },\n  },\n})',
  '      "@": resolve(import.meta.dirname, "./src"),\n    },\n  },\n  // Tests use an isolated API port; ordinary development uses :3000.\n  server: { proxy: { "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000" } },\n  preview: { proxy: { "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000" } },\n})')
patch(join(web, "playwright.config.ts"),
  "  fullyParallel: true,\n", "  // One shared database behind the API, so tests run one at a time.\n  workers: 1,\n",
  `  // Runs against the production build, mock backend included, exactly as a demo is deployed.
  webServer: {
    command: \`pnpm exec vite preview --port \${PORT} --strictPort\`,
    url: \`http://localhost:\${PORT}\`,
    reuseExistingServer: !process.env.CI,
  },`,
  `  // The production web build proxies /api to a fresh in-memory API.
  webServer: [
    {
      command: "pnpm --dir ../api start",
      url: "http://localhost:3017/api/health",
      env: { PORT: "3017", DATABASE_URL: "memory", DEMO: "true", ALLOW_GUEST: "true", AUTH_RATE_LIMIT: "10000", RATE_LIMIT: "10000" },
      reuseExistingServer: false,
    },
    {
      command: \`pnpm exec vite preview --port \${PORT} --strictPort\`,
      url: \`http://localhost:\${PORT}\`,
      env: { API_PROXY_TARGET: "http://localhost:3017" },
      reuseExistingServer: false,
    },
  ],`)
// The exact same browser tests must also pass without a backend.
writeFileSync(join(web, "playwright.demo.config.ts"), `import { defineConfig } from "@playwright/test"
import base from "./playwright.config"

export default defineConfig({
  ...base,
  outputDir: "test-results/demo",
  use: { ...base.use, baseURL: "http://localhost:5180" },
  webServer: {
    command: "pnpm exec vite preview --outDir dist-demo --port 5180 --strictPort",
    url: "http://localhost:5180",
    reuseExistingServer: false,
  },
})
`)
patch(join(web, "AGENTS.md"),
  "# Slipway React\n\nDemo-first React app. It runs with no backend: an in-browser mock API (MSW) answers `/api/*`\nwith seeded Korean data. Set `VITE_API_URL` and the same calls go to a real server instead.",
  "# Slipway Mono: web\n\nThe web app of the Slipway monorepo (read `../../AGENTS.md` first). By default it talks to\n`apps/api` on the same origin; `pnpm dev:demo` swaps in the in-browser mock backend (MSW).",
  "| `src/components/kr-inputs.tsx`, `src/lib/kr.ts` | Korean inputs, formatting, validation |",
  "| `src/components/kr-inputs.tsx` | Korean inputs. Formatting and validation come from `@slipway/shared/kr` |",
  "- `pnpm build && pnpm preview` serves the built app. Hand that to people, not `pnpm dev`: the dev server",
  "- `pnpm preview:demo` serves the mock build (after `pnpm build:demo`). Hand that to people, not `pnpm dev`: the dev server")

// --- api
writeFileSync(join(api, "src/contracts/kr.ts"), "export * from '@slipway/shared/kr';\n")
writeFileSync(join(api, "src/contracts/auth.ts"), "// Shapes shared with the web app live in packages/shared.\nexport * from '@slipway/shared/auth';\n")
json(join(api, "package.json"), (pkg) => {
  pkg.name = "@slipway/api"
  pkg.dependencies["@slipway/shared"] = "workspace:*"
})
patch(join(api, "AGENTS.md"),
  "# Slipway Nest\n\nThe real backend for Slipway web apps. It serves exactly the `/api/*` contract that the\nReact template's mock backend fakes, so a web app switches from demo to real by setting\n`VITE_API_URL`.",
  "# Slipway Mono: api\n\nThe API of the Slipway monorepo (read `../../AGENTS.md` first). It serves exactly the `/api/*`\ncontract that the web app's mock backend fakes.",
  "| `src/contracts/` | zod schemas and types shared with the web app. Same rules on both sides |",
  "| `src/contracts/` | Re-exports `@slipway/shared`, plus any server-only parsing |",
  "- The web app is the client of record. Any change to a request or response shape changes\n  `src/contracts/` here and the matching file in the web app, plus a contract test.",
  "- Shapes shared with the web app live in `packages/shared` (see `../../AGENTS.md`). Change them\n  there, then add a contract test here.")

if (!existsSync(join(mono, "AGENTS.md"))) throw new Error("templates/mono/AGENTS.md is hand-maintained and missing")
console.log("templates/mono synced from templates/react and templates/nest. Next: cd templates/mono && pnpm install && pnpm verify")
