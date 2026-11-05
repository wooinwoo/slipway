import { defineConfig, devices } from "@playwright/test"

// WSLg sets WAYLAND_DISPLAY; Firefox's Wayland probe (gfxtest -w) then hangs and outlives every run.
delete process.env.WAYLAND_DISPLAY

export default defineConfig({
  testDir: "parts-tests",
  testMatch: "**/*.parts.ts",
  fullyParallel: true,
  workers: 2,
  outputDir: "test-results/parts",
  reporter: "list",
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://127.0.0.1:5194",
    locale: "ko-KR",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-part", use: { ...devices["Desktop Firefox"] } },
    {
      name: "mobile-dark-part",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 390, height: 844 },
        colorScheme: "dark",
      },
    },
  ],
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5194 --strictPort",
    url: "http://127.0.0.1:5194/fixtures/parts/index.html",
    reuseExistingServer: false,
  },
})
