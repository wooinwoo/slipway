import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Each run gets a throwaway in-memory Postgres; no Docker, no cleanup.
    env: { DATABASE_URL: 'memory', DEMO: 'true', ALLOW_GUEST: 'true' },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
