// pnpm check:score: Lighthouse on every built page, best of three runs. Fails below the scores in
// `assertions`. Needs Chrome: CI runs it (.github/workflows/verify.yml); WSL's headless Chrome cannot.
// Lighthouse CI is fetched on demand (npx), so it adds nothing to the install.
module.exports = {
  ci: {
    collect: { staticDistDir: "./dist", numberOfRuns: 3 },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
}
