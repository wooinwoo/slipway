# Slipway maintenance

## Building an app with Slipway

When the request is to build an app (not to change Slipway itself), do not edit `templates/`.
The full flow is `plugin/skills/new/SKILL.md` (the `/slipway:new` command). In short:

1. Ask first, in one go: what the app is (a line or a PRD), the preset (react for a quick demo,
   next for Next.js App Router, mono for web + API + DB, nest for API only, astro for a landing or docs
   site, flutter to ship a web app to the app stores), whether to draft screens first with the
   k-style-ui-ux plugin (consumer mobile apps), and where it will be deployed (or later).
2. Create the project next to this repository and work only there:
   `node scripts/create-project.mjs ../<name> --preset <preset> --name "<서비스 이름>"`
   (`<name>`: lowercase letters, digits and hyphens), then `corepack pnpm install --frozen-lockfile`.
3. Generate each resource's data layer: `corepack pnpm gen resource <plural> <한글 이름> --fields "..."`.
   It writes the schema, table and migration, API, mock, query hooks and contract tests. No screens.
4. Fill `PRODUCT.md` with the user, then build every screen, the login and app frame included, from
   `src/patterns/` (CODEPACK.md recipes) following `DESIGN.md`. Screen design is this step's job; use the
   Impeccable skill for web design work when available. Then `corepack pnpm verify` (UI, bundle, e2e) and
   look at `pnpm shots`. CI adds the Lighthouse score.

Follow the generated project's AGENTS.md from step 2 on.

## Changing Slipway

- Read PRODUCT.md for product priorities: rapidly assembling requested demos from reusable
  screen patterns, consistent visual quality, easy editing, and clear structure. Prioritize
  composable patterns over polishing one default application. Default to React; use mono
  when a real API is needed. Keep implementation instructions out of product screens.
- Deliver independent code parts and contracts. Do not wire a business application, domain
  routes, menus or tables into the base template; keep usage examples in documentation or
  isolated fixtures. A preassembled customer application is explicitly out of scope.
- Register parts in codepack/catalog.json with their input/output contract, edit points,
  exports and constraints. scripts/pack.mjs resolves the selected source dependency graph.
  Copying a part must not alter routes, menus, package.json or user-modified files.
- Test component behavior in fixtures/parts and parts-tests, outside application entry points.

- This repository supplies independent starter projects. Modify `templates/react` and
  `templates/nest` first, then run `pnpm sync` (`sync-mono.mjs` and `sync-next.mjs`). `templates/next`
  copies the React parts, mock and API client; its `src/app/`, `proxy.ts`, `config.ts` and `app-shell.tsx`
  are hand-maintained. Generated mono application
  files should reproduce those sources; mono manifests, Turbo config and shared manifest
  are hand-maintained.
- Read the relevant template's AGENTS.md before editing it. Keep `templates/astro` and the
  Next-only files in step with the React preset's design rules and checks.
- Run `corepack pnpm test` for project creation and requirement traceability. Run the affected
  template's `verify`; `corepack pnpm verify` at the root includes the mono verification suite.
- Match README claims to current behavior. New generated projects receive
  `docs/feature-workflow.md` as `FEATURE-WORKFLOW.md`.
- Authentication identities use provider plus provider ID. Email collisions never merge
  accounts automatically. Guest identities are isolated; domain data must enforce ownership.
- Keep project generation dependency-free. Never copy ignored environment values, databases,
  dependencies or test output into a generated project; never overwrite an existing target.
