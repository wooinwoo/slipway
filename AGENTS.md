# Slipway maintenance

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
