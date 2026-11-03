// One database handle for the whole app. With DATABASE_URL unset it runs embedded
// Postgres (PGlite) from ./.data, so `pnpm dev` needs no Docker or install.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';

import * as schema from './schema.js';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export const DB = Symbol('DB');

// Scripts run from the project root, in dev (src/) and in production (dist/) alike.
const migrationsFolder = join(process.cwd(), 'drizzle');

/** `url`: a postgres:// URL, "memory" for tests, or undefined for ./.data/pglite. */
export async function connect(
  url: string | undefined,
): Promise<{ db: Db; close: () => Promise<void> }> {
  if (url?.startsWith('postgres')) {
    const db = drizzlePg(url, { schema });
    await migratePg(db, { migrationsFolder });
    return { db: db as unknown as Db, close: () => db.$client.end() };
  }
  const dataDir = url === 'memory' ? undefined : (url ?? './.data/pglite');
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder });
  return { db: db as unknown as Db, close: () => client.close() };
}
