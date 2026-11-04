import { defineConfig, devices } from "@playwright/test"

const PORT = 5179

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Generous on busy machines (several agents building at once); a real hang still fails.
  // A loaded machine (other builds, agents) slows Firefox; 60s per test keeps a slow pass from failing.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Firefox by default: headless Chromium renders no frames on some WSL setups.
  // Add `{ name: "chromium", use: devices["Desktop Chrome"] }` where it works (CI, macOS).
  projects: [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }],
  // Runs against the production build, mock backend included, exactly as a demo is deployed.
  webServer: {
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
