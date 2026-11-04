# Slipway Mono: web

The web app of the Slipway monorepo (read `../../AGENTS.md` first). By default it talks to
`apps/api` on the same origin; `pnpm dev:demo` swaps in the in-browser mock backend (MSW).

The template ships no screens. Every screen, the sign-in page and the app frame included, is
assembled per project from the parts in `src/patterns/`.

For the common requests (build a screen, add a resource, deploy) follow the step-by-step flow in the
project's `.claude/skills/<screen|resource|deploy>/SKILL.md`. Claude Code loads them on its own; other
tools read them from there.

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
- Money goes through `formatWon`, `formatWonKorean`, or `formatWonCompact`; times through `formatRelative`.
- A page reads data with `queryClient.ensureQueryData` in its route `loader` and `useSuspenseQuery`
  (or `useQuery` with placeholder data when search params change) in the component.

## Screens and design

Slipway gives you parts and a data layer, not screens and not a design. The look of every screen,
the sign-in page and the app frame included, comes from a design harness working with the user:

- Web: the Impeccable skill (`/impeccable`). Before the first screen it captures `PRODUCT.md` and
  `DESIGN.md` with the user; build screens with it, then `critique` and `polish`. If it isn't
  installed, ask the user to install it (https://impeccable.style) rather than inventing a style.
- Consumer mobile flows: a k-style-ui-ux draft, translated into these parts (don't copy its HTML).
- Parts in `src/patterns/` are building blocks: use, edit, restyle or skip them. Theme tokens in
  `src/index.css` are technical defaults for shadcn; the harness rewrites them.
- Never make up a logo, favicon or app icon (a letter in a shape, a stock icon standing in for the brand). Use only the logo file the user supplies: `pnpm brand <file>` puts it in `public/` and makes it the favicon, then pass it to `AppShell`'s `logo`. Until then the product name stands as plain text and you ask the user for a logo.
- Whatever the design, it passes `pnpm check:ui` (accessibility, contrast, focus, overflow, cursor,
  console errors) and the e2e tests. Look at `pnpm shots` before calling a screen done.

Wiring facts (not a layout): sign-in calls the hooks in `src/api/auth.ts`; a layout route's
`beforeLoad` ensures `meQuery` and redirects without a user; each route sets `staticData: { title }`
for the tab and the `AppShell` breadcrumb. Details: CODEPACK.md ("인증 연결").

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
4. Add the page to the `nav` you pass to `AppShell` in the layout route.
5. Add `REQ-n` entries and e2e tests.

Guest sign-in creates a new identity each time. Never assume one global guest ID.
Use the returned user's ID to scope new domain data.
