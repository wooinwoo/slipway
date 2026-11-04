// pnpm check:score: Lighthouse on every page (server started with `next start`), best of three runs.
// Fails below the scores in `assertions`. Needs Chrome: CI runs it; WSL's headless Chrome cannot.
// Lighthouse CI is fetched on demand (npx), so it adds nothing to the install.
const { readdirSync } = require("node:fs")

const routes = readdirSync("src/app", { recursive: true })
  .map((file) => String(file).replace(/\\/g, "/"))
  .filter((file) => /(^|\/)page\.tsx$/.test(file) && !file.includes("["))
  .map((file) => "/" + file.replace(/(^|\/)page\.tsx$/, "").split("/").filter((part) => part && !/^\(.*\)$/.test(part)).join("/"))
  .filter((route) => route !== "/auth/callback")

module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm exec next start -p 3458",
      startServerReadyPattern: "Ready",
      url: routes.map((route) => `http://localhost:3458${route}`),
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
}
