# Slipway maintenance

## Building an app with Slipway

When the request is to build an app (not to change Slipway itself), do not edit `templates/`.
The full flow is `plugin/skills/new/SKILL.md` (the `/slipway:new` command; Claude Code also loads it from
`.claude/skills`, a link to `plugin/skills`). In short:

1. Ask first, in one go: what the app is (a line or a PRD), the preset (react for a quick demo,
   next for Next.js App Router, mono for web + API + DB, nest for API only, astro for a landing or docs
   site, flutter to ship a web app to the app stores), the design harness (Impeccable for web,
   a k-style-ui-ux draft first for consumer mobile apps), and where it will be deployed (or later).
2. Create the project next to this repository and work only there:
   `node scripts/create-project.mjs ../<name> --preset <preset> --name "<서비스 이름>"`
   (`<name>`: lowercase letters, digits and hyphens), then `corepack pnpm install --frozen-lockfile`.
3. Generate each resource's data layer: `corepack pnpm gen resource <plural> <한글 이름> --fields "..."`.
   It writes the schema, table and migration, API, mock, query hooks and contract tests. No screens.
4. Build every screen, the login and app frame included: the function from `src/patterns/` and the
   generated hooks, the look from the design harness (Impeccable writes `PRODUCT.md` and `DESIGN.md`
   with the user; never invent a style or ship Slipway examples as the design). Then `corepack pnpm
   verify` (UI, bundle, e2e), look at `pnpm shots`, and click through the main flow at the exact URL you
   hand over. CI adds the Lighthouse score.

Follow the generated project's AGENTS.md from step 2 on.

## Changing Slipway

- Read PRODUCT.md for product priorities: apps assembled fast from setup code, parts and a
  generated data layer, carried to production; no re-setup; freedom to edit anything; clear
  structure. Slipway is a tool: it ships no screens and no design. Default to React; use mono
  when a real API is needed.
- Ship no logo, favicon or icon of Slipway's in a template, and no part that draws a placeholder mark
  (a letter in a shape). Parts take the product's real logo as a prop or show the name as text;
  `scripts/brand.mjs` (`pnpm brand`) only wires a file the user supplies.
- Ship no design: no DESIGN.md or PRODUCT.md templates, no style rules, no galleries, no layout
  recipes or example screens. The look of every screen comes from the design harness (Impeccable,
  k-style-ui-ux) in each project. Docs state contracts and wiring facts only.
- Deliver independent code parts and contracts. Do not wire a business application, domain
  routes, menus or tables into the base template, and ship no usage examples; part behavior is
  tested in isolated fixtures. A preassembled customer application is explicitly out of scope.
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
- Run `corepack pnpm test` for the generator, project creation and requirement traceability. Run the
  affected template's `verify`; `corepack pnpm verify` at the root runs every template's. Human-facing
  maintenance notes are in CONTRIBUTING.md; keep it and this file in agreement.
- Match README claims to current behavior. New generated projects receive
  `docs/feature-workflow.md` as `FEATURE-WORKFLOW.md`.
- Authentication identities use provider plus provider ID. Email collisions never merge
  accounts automatically. Guest identities are isolated; domain data must enforce ownership.
- Keep project generation dependency-free. Never copy ignored environment values, databases,
  dependencies or test output into a generated project; never overwrite an existing target.
