<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Slipway Next

Next.js App Router setup with the same parts, theme, API client and mock backend as the Slipway React
preset (copied by `scripts/sync-next.mjs` in Slipway). It runs with no backend: an in-browser mock API
(MSW) answers `/api/*`. Set `NEXT_PUBLIC_API_URL` and the same calls go to a real server (the Nest
preset). It ships no screens; build them per project from `src/patterns/`.

For the common requests (build a screen, add a resource, deploy) follow the step-by-step flow in the
project's `.claude/skills/<screen|resource|deploy>/SKILL.md`. Claude Code loads them on its own; other
tools read them from there.

## Commands

- `pnpm dev` starts http://localhost:3000.
- `pnpm verify` runs typecheck, lint, unit tests, build, the bundle budget, e2e and the UI check. Run it
  before reporting a task as done. Fix the cause of a failure; do not weaken a check.
- `pnpm shots [route ...]` builds and screenshots routes (desktop and mobile, light and dark) into
  `.shots/`. Open the images before calling UI work done.
- `pnpm check:ui [route ...]` checks the same pages: accessibility and contrast (axe, WCAG 2.1 AA),
  sideways overflow, pointer cursor on clickables, visible keyboard focus, console errors.
- `pnpm check:bundle` keeps each page's gzipped first load within `slipway.budget` in package.json.
- `pnpm check:score` runs Lighthouse. It needs Chrome, so CI runs it (`.github/workflows/verify.yml`).
- `pnpm audit:deps` fails on high-severity dependency advisories.

## Map

| Path | What lives there |
|---|---|
| `src/config.ts` | Product name and copy, `isDemo` flag |
| `src/app/layout.tsx` | Metadata, the before-paint theme script, providers |
| `src/app/providers.tsx` | React Query, theme, tooltips, toasts; starts the mock worker in demo mode |
| `src/proxy.ts` | Per-request Content-Security-Policy nonce (pages render dynamically because of it) |
| `next.config.ts` | Security headers, the msw/browser alias for server builds |
| `src/patterns/` | Screen parts. `app-shell.tsx` is the Next version (next/link); the rest match the React preset |
| `src/features/<action>/` | One thing a user does: its form, sheet, rules, hooks. Pages in `src/app/` compose features |
| `src/entities/<resource>/` | `api.ts` (schema, queries, mutations) and `mock.ts` (mock endpoints), written by `pnpm gen` |
| `src/api/`, `src/mocks/` | API client (`failureOf`), auth hooks (`currentUser`), mock backend wiring. Same `/api/*` contract as the Nest preset |
| `src/components/ui/` | shadcn, every component installed |

## Rules

- Slipway gives you parts and a data layer, not screens or a design. The look comes from a design
  harness with the user: k-style-ui-ux (`/k-style-ui-ux:go <PRD>`) for mobile apps, meaning screens used
  mainly on a phone (its `out/` is the design, don't paste its HTML: `pnpm design out` writes its tokens into
  `src/app/globals.css` and its component styles into `src/design/k-style.css` (classes prefixed `k-`), write
  each `out/screens/<id>.html` as JSX with those classes: `MobileShell className="k-screen ..."` as the root and
  `<main>`, the design's own app bar/tab bar/CTA markup with `useBack("/list")` and `next/link`, `BottomSheet
  className="k-sheet" overlayClassName="k-dim"` for sheets, `failureOf` for form errors; seed the demo account in `src/mocks/db.ts` with `out/journey.md`'s scenario data, then
  `pnpm design:compare --now <the journey's time> /route=<id>.html ...` and fix what differs); the Impeccable skill (`/impeccable`, which writes `PRODUCT.md` and `DESIGN.md`) for desktop web
  and landing pages. Hand people the built app (`pnpm build && pnpm start`), not `pnpm dev`. If the harness isn't installed, ask the user to install it rather than inventing a style. Every design passes `pnpm check:ui` and the e2e tests.
- Never make up a logo, favicon or app icon (a letter in a shape, a stock icon standing in for the brand). Use only the logo file the user supplies: `pnpm brand <file>` puts it in `public/` and makes it the favicon (`src/app/icon.*`), then pass it to `AppShell`'s `logo`. Until then the product name stands as plain text and you ask the user for a logo.
- Interactive parts are client components (`"use client"`). Keep pages as server components when they
  only arrange parts; data comes from the TanStack Query hooks in `src/entities/` on the client.
- Layers import downward only: `src/app` -> `features` -> `entities` -> shared code (`components`,
  `patterns`, `lib`, `api`, `hooks`); ESLint enforces it.
- A signed-in area is a layout (`src/app/(app)/layout.tsx`, client) that reads `meQuery`, sends visitors
  without a user to `/login` with `router.replace`, and wraps `children` in `<AppShell>`. Sign-in pages
  use `src/patterns/auth-forms.tsx` with the hooks in `src/api/auth.ts`.
- Give each page `export const metadata = { title }`; the layout appends the product name.
- No inline `<script>` without the nonce (`headers().get("x-nonce")`): the CSP blocks it.
- Money goes through `formatWon`; times through `formatRelative`.

## Adding a resource

In a project made by Slipway, `pnpm gen resource <plural> <한글 이름> --fields "..."` writes the data
layer (`src/entities/<resource>/api.ts` and `mock.ts`, an API contract test). It never writes screens.
