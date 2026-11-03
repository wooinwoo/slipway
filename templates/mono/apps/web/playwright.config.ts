import { defineConfig, devices } from "@playwright/test"

const PORT = 5179

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  // One shared database behind the API, so tests run one at a time.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  // Generous on busy machines (several agents building at once); a real hang still fails.
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
  // The production web build proxies /api to a fresh in-memory API.
  webServer: [
    {
      command: "pnpm --dir ../api start",
      url: "http://localhost:3000/api/health",
      env: { DATABASE_URL: "memory", DEMO: "true", ALLOW_GUEST: "true" },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec vite preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
