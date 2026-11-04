# Slipway Mono: web

The web app of the Slipway monorepo (read `../../AGENTS.md` first). By default it talks to
`apps/api` on the same origin; `pnpm dev:demo` swaps in the in-browser mock backend (MSW).

The template ships no screens. Every screen, the sign-in page and the app frame included, is
assembled per project from the parts in `src/patterns/`.

## Commands

- `pnpm dev` starts http://localhost:5173.
- `pnpm verify` runs typecheck, lint, unit tests, the requirements check, build, the bundle budget,
  e2e, and the UI check. Run it before reporting a task as done. Fix the cause of a failure; do not
  weaken a check.
- `pnpm shots [route ...]` builds and screenshots routes (desktop and mobile, light and dark) into
  `.shots/`. Open the images before calling UI work done.
- `pnpm check:ui [route ...]` checks the same pages: accessibility and contrast (axe, WCAG 2.1 AA),
  sideways overflow, pointer cursor on clickables, visible keyboard focus, console errors.
- `pnpm check:bundle` keeps the gzipped build within `slipway.budget` in package.json.
- `pnpm check:score` runs Lighthouse (performance 90, accessibility/best practices/SEO 95). It needs
  Chrome, so CI runs it (`.github/workflows/verify.yml`); WSL cannot.
- `pnpm audit:deps` fails on high-severity dependency advisories.

## Map

| Path | What lives there |
|---|---|
| `src/config.ts` | Product name and copy, `isDemo` flag |
| `src/patterns/` | Screen parts: app shell, sign-in forms, theme settings, table, filters, chart, board, form and more (see CODEPACK.md) |
| `src/index.css` | Theme tokens. `--brand-h` and `--brand-c` re-skin the whole app |
| `src/api/<resource>.ts` | zod schema, types, query options, mutations for one resource |
| `src/mocks/` | Mock backend: `db.ts` (localStorage and initial demo account), `handlers/<resource>.ts` |
| `src/routes/` | TanStack Router file routes. Ships only the root, an empty `/` and `/auth/callback` (Kakao/Naver landing) |
| `src/components/ui/` | shadcn, every component installed. Don't hand-edit; re-add with `pnpm dlx shadcn add <name> -o` |
| `src/components/kr-inputs.tsx` | Korean inputs. Formatting and validation come from `@slipway/shared/kr` |
| `docs/requirements.md` | The `REQ-n` list the demo must satisfy |

## Rules

- Requirements first. Add `## REQ-n title` to `docs/requirements.md`, start the route file that
  implements it with `// REQ-n title`, and name an e2e test `REQ-n ...`. `pnpm check:reqs` enforces all three.
- Validation lives once, in the resource's zod schema. The form and the mock handler both parse with it,
  and server field errors come back on the same field names.
- Reach for an installed shadcn component before writing new UI. Use semantic tokens
  (`bg-primary`, `text-muted-foreground`, `border`), not raw colors. Status dots are the one exception.
- Money goes through `formatWon`, `formatWonKorean`, or `formatWonCompact`; times through `formatRelative`.
  Numbers in tables and cards get the `tabular` class.
- UI copy is Korean, short, and plain. Say what happened and what to do next.
- A page reads data with `queryClient.ensureQueryData` in its route `loader` and `useSuspenseQuery`
  (or `useQuery` with placeholder data when search params change) in the component.

## Building screens

Screens and their design are yours to build here; Slipway ships parts, not screens.

- Read `PRODUCT.md` (who, why, tone) and `DESIGN.md` (tokens, type, layout, component rules) first.
  Fill `PRODUCT.md` with the user before the first screen.
- For design work, use the Impeccable skill if it is available (`/impeccable` critique, audit, polish;
  it reads the same PRODUCT.md and DESIGN.md). For consumer mobile flows, a k-style-ui-ux draft is a
  good starting point; translate it into these parts, don't copy its HTML.
- Loop: build → `pnpm shots` → look at every image → fix → `pnpm check:ui`.
- Sign-in: `src/routes/login.tsx` renders `AuthCard` with `LoginForm`, `SocialButtons` and
  `GuestButton` from `src/patterns/auth-forms.tsx`, and calls the hooks in `src/api/auth.ts`.
- Signed-in area: a layout route `src/routes/_app.tsx`. Its `beforeLoad` ensures `meQuery` and
  redirects to `/login` without a user; its component wraps `<Outlet />` in `<AppShell>`.
- Give each route `staticData: { title }`. It names the tab and the `AppShell` breadcrumb.
- The recipes with code are in CODEPACK.md ("로그인과 앱 틀 조립").

## Adding a resource

Select independent components from `src/patterns/`. Do not preassemble business
screens or register domain menus/APIs in the base template. Patterns must not import
domain types or API clients.
Read `CODEPACK.md` in a generated project (or `docs/codepack.md` in Slipway).
Define the acceptance criteria first. In a project made by Slipway, `pnpm gen resource <plural> <한글 이름> --fields "..."` writes the data
layer at once (run `node scripts/gen.mjs` for the field syntax). It never writes screens.

1. `src/api/<resource>.ts` holds the schema and queries.
2. `src/mocks/handlers/<resource>.ts` holds the endpoints. Register it in `src/mocks/browser.ts`,
   and add the table and seed rows in `src/mocks/db.ts`.
3. `src/routes/_app/<resource>/` holds the pages, including loading, empty, and error states.
4. Add the page to `nav` in `src/components/app-sidebar.tsx`.
5. Add `REQ-n` entries and e2e tests.

Guest sign-in creates a new identity each time. Never assume one global guest ID.
Use the returned user's ID to scope new domain data.
