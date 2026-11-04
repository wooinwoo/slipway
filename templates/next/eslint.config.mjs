import fsd from "./scripts/fsd.mjs"
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/mockServiceWorker.js", "lighthouserc.cjs", ".shots/**", "test-results/**"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { fsd },
    rules: { "fsd/layers": "error" },
  },
  {
    // shadcn-generated files stay as upstream ships them, so `shadcn add -o` can refresh them.
    files: ["src/shared/ui/**", "src/shared/hooks/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
])
