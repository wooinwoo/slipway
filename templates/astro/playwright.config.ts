import { defineConfig, devices } from "@playwright/test"

// WSLg sets WAYLAND_DISPLAY; Firefox's Wayland probe (gfxtest -w) then hangs and outlives every run.
delete process.env.WAYLAND_DISPLAY
// Tests write local times ("2026-11-04T18:50") that Node parses; keep Node on the browser timezone, UTC CI runners too.
process.env.TZ = "Asia/Seoul"

const PORT = 4398

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "ko-KR", trace: "retain-on-failure" },
  // Firefox by default: headless Chromium renders no frames on some WSL setups.
  projects: [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }],
  // Runs against the production build, exactly as it is deployed.
  webServer: {
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
