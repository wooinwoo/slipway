import { defineConfig, devices } from "@playwright/test"

// WSLg sets WAYLAND_DISPLAY; Firefox's Wayland probe (gfxtest -w) then hangs and outlives every run.
delete process.env.WAYLAND_DISPLAY
// Tests write local times ("2026-11-04T18:50") that Node parses; keep Node on the browser timezone, UTC CI runners too.
process.env.TZ = "Asia/Seoul"

const PORT = 3457

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // A loaded machine (other builds, agents) slows Firefox; 60s per test keeps a slow pass from failing.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "ko-KR", timezoneId: "Asia/Seoul", trace: "retain-on-failure" },
  // Firefox by default: headless Chromium renders no frames on some WSL setups.
  projects: [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }],
  // Runs against the production build, mock backend included, exactly as a demo is deployed.
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
