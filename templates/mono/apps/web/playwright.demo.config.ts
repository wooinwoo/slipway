import { defineConfig } from "@playwright/test"
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
