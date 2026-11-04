# Slipway Mono: api

The API of the Slipway monorepo (read `../../AGENTS.md` first). It serves exactly the `/api/*`
contract that the web app's mock backend fakes. Runs with zero setup: embedded Postgres (PGlite) in `./.data`, seeded with
the same demo account as the web mock (demo@slipway.dev / demo1234).

## Commands

- `pnpm dev` starts http://localhost:3000/api with watch mode.
- `pnpm verify` runs typecheck, lint, unit tests, API contract tests, and build.
  Run it before reporting a task as done. Fix the cause of a failure; do not weaken a check.
- `pnpm db:generate` writes a SQL migration after a schema change. The app applies migrations on start.

## Map

| Path | What lives there |
|---|---|
| `src/config.ts` | Every env setting, parsed with zod. See `.env.example` |
| `src/contracts/` | Re-exports `@slipway/shared`, plus any server-only parsing |
| `src/db/` | Drizzle schema, connection (PGlite or Postgres), demo account seed |
| `src/common/http.ts` | `parse()` for request bodies and `fail()` for errors, both in the `{ message, fields }` shape |
| `src/auth/` | Email, guest, Kakao and Naver sign-in, bearer sessions, `AuthGuard` + `@CurrentUser()` |
| `test/api.e2e-spec.ts` | Contract tests against a fresh in-memory database |

## Rules

- Shapes shared with the web app live in `packages/shared` (see `../../AGENTS.md`). Change them
  there, then add a contract test here.
- Validate every body and query with `parse(schema, value)`. Throw `fail(status, message, fields)`
  for expected errors. Messages are Korean and tell the user what to do.
- Inject with an explicit token, `@Inject(Service)`, not by type alone.
- Every route that touches user data sits behind `@UseGuards(AuthGuard)`.
- Passwords and tokens go through `src/common/crypto.ts` only. Never log a token.
- Social identity is the provider plus provider ID. Never merge accounts just because emails match.
- Each guest receives a separate account. New domain data must be scoped to the current user.
- Imports use the `.js` suffix (ESM, `nodenext`).

## Adding a resource

In a project made by Slipway, `pnpm gen resource <plural> <한글 이름> --fields "..."` writes all of
this at once (run `node scripts/gen.mjs` for the field syntax). The steps describe what it produces,
for editing the result or doing it by hand.

1. Add the zod schema to `src/contracts/<resource>.ts` (Korean validators are in `src/contracts/kr.ts`).
2. Add the table to `src/db/schema.ts`, then `pnpm db:generate`.
3. Create `src/<resource>/` with a service (inject `DB`), a controller behind `AuthGuard` that
   parses every body with `parse()`, and a module. Register the module in `src/app.module.ts`.
4. Add contract tests in `test/`.
