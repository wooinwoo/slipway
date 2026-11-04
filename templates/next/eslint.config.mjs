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
  // Layers import downward only: src/app (pages) -> features -> entities -> shared code (components,
  // patterns, lib, api, hooks). A feature or entity uses relative paths inside its own folder.
  {
    files: ["src/entities/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["@/features", "@/features/**", "@/app", "@/app/**"], message: "Entities sit below features and pages: move the shared piece down or pass it in as a prop." }] }] },
  },
  {
    files: ["src/features/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["@/features", "@/features/**", "@/app", "@/app/**"], message: "A feature uses entities and shared code. Compose features in a page; inside one feature use relative paths." }] }] },
  },
  {
    files: ["src/components/**", "src/patterns/**", "src/lib/**", "src/api/**", "src/hooks/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["@/entities", "@/entities/**", "@/features", "@/features/**", "@/app", "@/app/**"], message: "Shared code knows no domain: keep entities, features and pages out of it." }] }] },
  },
  {
    // shadcn-generated files stay as upstream ships them, so `shadcn add -o` can refresh them.
    files: ["src/components/ui/**", "src/hooks/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
])
