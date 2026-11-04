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
  // FSD layers import downward only: src/app (pages and the app shell) -> widgets -> features ->
  // entities -> shared. Slices on one layer don't import each other; inside a slice use relative paths.
  ...[
    ["src/widgets/**", ["@/widgets", "@/app", "@/mocks"], "A widget composes features and entities; pages compose widgets."],
    ["src/features/**", ["@/features", "@/widgets", "@/app", "@/mocks"], "A feature uses entities and shared code. Compose features in a widget or a page."],
    ["src/entities/**", ["@/features", "@/widgets", "@/app", "@/mocks"], "Entities sit below features: move the shared piece down or pass it in as a prop."],
    ["src/shared/**", ["@/entities", "@/features", "@/widgets", "@/app", "@/mocks"], "Shared code knows no domain: keep entities, features, widgets and pages out of it."],
  ].map(([files, layers, message]) => ({
    files: [files],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: layers.flatMap((layer) => [layer, `${layer}/**`]), message }] }] },
  })),
  {
    // shadcn-generated files stay as upstream ships them, so `shadcn add -o` can refresh them.
    files: ["src/shared/ui/**", "src/shared/hooks/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
])
