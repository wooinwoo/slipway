import fsd from "./scripts/fsd.mjs"
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
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { fsd },
    rules: { "fsd/layers": "error" },
  },
  {
    // shadcn-generated files stay as upstream ships them, so `shadcn add -o` can refresh them.
    files: ['src/shared/ui/**', 'src/shared/hooks/**'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
])
