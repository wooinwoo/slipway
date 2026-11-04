// Every setting the API reads, parsed once at startup. Copy .env.example to .env to change them.
import { existsSync } from 'node:fs';

import { z } from 'zod';

// Tests pin their own settings, so a developer's .env never points them at a real database.
if (existsSync('.env') && !process.env.VITEST) process.loadEnvFile('.env');

const schema = z.object({
  PORT: z.coerce.number().int().default(3000),
  /** postgres://... for a real database; unset for embedded PGlite in ./.data; "memory" in tests. */
  DATABASE_URL: z.string().optional(),
  /** Web app origin(s), comma-separated. Used for CORS and as the OAuth return address. */
  WEB_URL: z.string().default('http://localhost:5173'),
  /** This API's public origin, used to build OAuth redirect URIs. */
  API_URL: z.string().default('http://localhost:3000'),
  /** Built web app (its dist folder). When set, this server also serves it on the same origin. */
  WEB_DIST: z.string().optional(),
  /** One-click guest sign-in. Turn off for anything public. */
  ALLOW_GUEST: z.stringbool().default(true),
  /** Creates the demo account (demo@slipway.dev / demo1234) on startup. */
  DEMO: z.stringbool().default(true),
  SESSION_DAYS: z.coerce.number().int().positive().default(30),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
});

export const config = schema.parse(process.env);
export const webOrigins = config.WEB_URL.split(',').map((origin) =>
  origin.trim(),
);
