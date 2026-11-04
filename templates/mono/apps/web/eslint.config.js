import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-demo', 'public/mockServiceWorker.js', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // FSD layers import downward only: app (main.tsx, index.css, mocks) -> routes (pages) -> widgets ->
  // features -> entities -> shared. Slices on one layer don't import each other; inside a slice use
  // relative paths.
  ...[
    ['src/widgets/**', ['@/widgets', '@/routes', '@/mocks'], 'A widget composes features and entities; pages compose widgets.'],
    ['src/features/**', ['@/features', '@/widgets', '@/routes', '@/mocks'], 'A feature uses entities and shared code. Compose features in a widget or a page.'],
    ['src/entities/**', ['@/features', '@/widgets', '@/routes', '@/mocks'], 'Entities sit below features: move the shared piece down or pass it in as a prop.'],
    ['src/shared/**', ['@/entities', '@/features', '@/widgets', '@/routes', '@/mocks'], 'Shared code knows no domain: keep entities, features, widgets and pages out of it.'],
  ].map(([files, layers, message]) => ({
    files: [files],
    rules: { 'no-restricted-imports': ['error', { patterns: [{ group: layers.flatMap((layer) => [layer, `${layer}/**`]), message }] }] },
  })),
  {
    // shadcn-generated files stay as upstream ships them, so `shadcn add -o` can refresh them.
    files: ['src/shared/ui/**', 'src/shared/hooks/**'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
])
