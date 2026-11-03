import { defineConfig } from 'drizzle-kit';

// `pnpm db:generate` writes SQL migrations to ./drizzle after you change src/db/schema.ts.
// The app applies them on startup, for PGlite and Postgres alike.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
