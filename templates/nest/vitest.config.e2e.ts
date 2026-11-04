import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Each run gets a throwaway in-memory Postgres; no Docker, no cleanup.
    env: {
      DATABASE_URL: 'memory',
      DEMO: 'true',
      ALLOW_GUEST: 'true',
      // Contract tests sign in many times; test/security.e2e-spec.ts checks the limits themselves.
      AUTH_RATE_LIMIT: '10000',
      RATE_LIMIT: '10000',
    },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
