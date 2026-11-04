// Every setting the API reads, parsed once at startup. Copy .env.example to .env to change them.
import { existsSync } from 'node:fs';

import { z } from 'zod';

// Tests pin their own settings, so a developer's .env never points them at a real database.
if (existsSync('.env') && !process.env.VITEST) process.loadEnvFile('.env');

// NODE_ENV=production (the Docker images set it) turns the demo conveniences off by default
// and refuses to start without the public addresses.
const production = process.env.NODE_ENV === 'production';

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
  /** One-click guest sign-in. Off by default in production; turn on for a public demo. */
  ALLOW_GUEST: z.stringbool().default(!production),
  /** Creates the demo account (demo@slipway.dev / demo1234) on startup. Off by default in production. */
  DEMO: z.stringbool().default(!production),
  /** Sign-in, sign-up and guest requests allowed per client IP per minute. */
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  /** Requests per client IP per minute for every other route. */
  RATE_LIMIT: z.coerce.number().int().positive().default(300),
  /**
   * Proxies in front of this server (load balancer, PaaS router), so rate limits see the real client IP.
   * 0 when clients connect directly. Defaults to 1 in production.
   */
  TRUST_PROXY: z.coerce
    .number()
    .int()
    .min(0)
    .default(production ? 1 : 0),
  SESSION_DAYS: z.coerce.number().int().positive().default(30),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
});

export const config = schema.parse(process.env);

if (production) {
  const missing = ['WEB_URL', 'API_URL'].filter((key) => !process.env[key]);
  if (missing.length)
    throw new Error(
      `Set ${missing.join(' and ')} to the public address in production (see .env.example).`,
    );
  if (!config.DATABASE_URL?.startsWith('postgres'))
    console.warn(
      'DATABASE_URL is not a Postgres URL: data lives in the container (PGlite) and is lost when it is replaced.',
    );
}
export const webOrigins = config.WEB_URL.split(',').map((origin) =>
  origin.trim(),
);
