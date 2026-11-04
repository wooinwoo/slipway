# Slipway Mono

Web (`apps/web`, React) and API (`apps/api`, Nest), with one shared package
(`packages/shared`) for every rule both sides must agree on: zod schemas and Korean
formatting and validation.

`apps/web` and `apps/api` are generated from `templates/react` and `templates/nest` by
`node scripts/sync-mono.mjs` at the Slipway repo root. Inside a project made from this
template they are ordinary code; edit them freely.

## Commands

- `pnpm dev` builds `packages/shared`, then runs it in watch mode, the API on :3000, and the web
  app on :5173. The web app proxies `/api` to the API, so there is no CORS setup.
- `pnpm dev:demo` runs only the web app, on its in-browser mock backend.
- `pnpm verify` runs every package's checks. The web e2e suite runs against a fresh in-memory API.

## Where a change goes

| Change | Place |
|---|---|
| A field, validation rule, or Korean helper | `packages/shared/src/` |
| A screen, form, or query | `apps/web/` (see its `AGENTS.md`) |
| An endpoint, table, or auth rule | `apps/api/` (see its `AGENTS.md`) |

## Rules

- A request or response shape changes in `packages/shared` first, then in the API, then in the
  web app, then in tests on both sides (API contract test and web e2e).
- Never copy a schema into an app. Import it from `@slipway/shared/<module>`.
- Outside `pnpm dev`, rebuild after editing shared code: `pnpm --filter @slipway/shared build`.

## Adding a resource

Run `pnpm gen resource ...` at the repo root: it writes every step below across `packages/shared`,
`apps/api` and `apps/web`, including the migration. The steps describe what it produces.

1. `packages/shared/src/<resource>.ts`: zod schema and types. Export it from `index.ts`.
2. `apps/api`: table in `src/db/schema.ts` and `pnpm db:generate`, then a module behind `AuthGuard`
   (steps in `apps/api/AGENTS.md`).
3. `apps/web`: query options in `src/api/<resource>.ts`, a route under `src/routes/_app/`, a `nav`
   entry, and a mock handler in `src/mocks/` so `pnpm dev:demo` keeps working.
4. Add `REQ-n` entries, API contract tests, and web e2e tests.
