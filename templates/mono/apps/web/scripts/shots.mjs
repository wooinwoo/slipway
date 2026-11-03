// pnpm shots [route ...]
// Builds nothing; serves the current dist/ and screenshots each route at desktop and mobile,
// light and dark, into .shots/. Signed-in routes go through guest login first.
// Agents: look at these images before calling a UI change done.
import { spawn } from "node:child_process"
import { mkdirSync } from "node:fs"
import { firefox } from "@playwright/test"

const PORT = 5199
const base = `http://localhost:${PORT}`
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["/login", "/signup", "/home", "/settings", "/home/missing"]
const publicRoutes = new Set(["/login", "/signup"])
const out = ".shots"
mkdirSync(out, { recursive: true })

const server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" })
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
      const errors = []
      // A fresh tab per route: Firefox aborts a goto that follows another goto in the same tab
      // while the mock service worker is active. Storage (and so the session) is shared.
      const open = async (route) => {
        const page = await context.newPage()
        page.on("pageerror", (e) => errors.push(e.message))
        await page.goto(`${base}${route}`)
        await page.waitForLoadState("networkidle")
        return page
      }
      let signedIn = false
      for (const route of routes) {
        if (!publicRoutes.has(route) && !signedIn) {
          const login = await open("/login")
          await login.getByRole("button", { name: "가입 없이 둘러보기" }).click()
          await login.waitForURL(/\/home$/)
          await login.close()
          signedIn = true
        }
        const page = await open(route)
        const name = route.replace(/^\//, "").replace(/\//g, "-") || "root"
        await page.screenshot({ path: `${out}/${name}.${size}.${scheme}.png`, fullPage: true })
        await page.close()
      }
      if (errors.length) console.log(`[${size} ${scheme}] page errors:\n  ${[...new Set(errors)].join("\n  ")}`)
      await context.close()
    }
  }
  await browser.close()
  console.log(`${routes.length * 4} screenshots in ${out}/`)
} finally {
  server.kill()
}
