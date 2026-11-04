// pnpm check:score: Lighthouse on the production build, every static route, best of three runs.
// Lighthouse CI is fetched on demand (npx), so it adds nothing to the install.
// Fails below the scores in `assertions`. Needs Chrome: runs in CI (.github/workflows/verify.yml), on macOS
// and on most Linux machines; WSL's headless Chrome cannot render, so run it in CI there.
// LHCI_DIST picks the build folder (the monorepo checks the mock build in dist-demo).
const { readFileSync } = require("node:fs")

const tree = readFileSync("src/routeTree.gen.ts", "utf8")
const block = /export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/.exec(tree)?.[1] ?? ""
const routes = [...block.matchAll(/^\s+['"]([^'"]+)['"]:/gm)]
  .map((m) => m[1])
  .filter((route) => !route.includes("$") && route !== "/auth/callback")

module.exports = {
  ci: {
    collect: {
      staticDistDir: process.env.LHCI_DIST ?? "dist",
      isSinglePageApplication: true,
      url: routes.map((route) => `http://localhost${route}`),
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
