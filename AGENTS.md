# Slipway maintenance

## Building an app with Slipway

When the request is to build an app (not to change Slipway itself), do not edit `templates/`.
The full flow is `plugin/skills/new/SKILL.md` (the `/slipway:new` command). In short:

1. Ask first, in one go: what the app is (a line or a PRD), the preset (react for a quick demo,
   mono for web + API + DB, nest for API only), whether to draft screens first with the
   k-style-ui-ux plugin (consumer mobile apps), and where it will be deployed (or later).
2. Create the project next to this repository and work only there:
   `node scripts/create-project.mjs ../<name> --preset <preset> --name "<서비스 이름>"`
   (`<name>`: lowercase letters, digits and hyphens), then `corepack pnpm install --frozen-lockfile`.
3. Generate each resource's data layer: `corepack pnpm gen resource <plural> <한글 이름> --fields "..."`.
   It writes the schema, table and migration, API, mock, query hooks and contract tests. No screens.
4. Build every screen, the login and app frame included, from `src/patterns/` (CODEPACK.md recipes).
   Screen design is this step's job. Then `corepack pnpm verify` and look at `pnpm shots`.

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
  `templates/nest` first, then run `node scripts/sync-mono.mjs`. Generated mono application
  files should reproduce those sources; mono manifests, Turbo config and shared manifest
  are hand-maintained.
- Read the relevant template's AGENTS.md before editing it. Leave the deferred Next preset
  alone unless that preset is explicitly in scope.
- Run `corepack pnpm test` for project creation and requirement traceability. Run the affected
  template's `verify`; `corepack pnpm verify` at the root includes the mono verification suite.
- Match README claims to current behavior. New generated projects receive
  `docs/feature-workflow.md` as `FEATURE-WORKFLOW.md`.
- Authentication identities use provider plus provider ID. Email collisions never merge
  accounts automatically. Guest identities are isolated; domain data must enforce ownership.
- Keep project generation dependency-free. Never copy ignored environment values, databases,
  dependencies or test output into a generated project; never overwrite an existing target.
