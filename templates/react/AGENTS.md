# Slipway React

Demo-first React app. It runs with no backend: an in-browser mock API (MSW) answers `/api/*`
with seeded Korean data. Set `VITE_API_URL` and the same calls go to a real server instead.

The template ships no screens. Every screen, the sign-in page and the app frame included, is
assembled per project from the parts in `src/shared/patterns/`.

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
- `pnpm design <k-style out dir> [--palette <name>]` copies the design harness's tokens into `src/index.css`.
- `pnpm design:compare /route=screen.html ...` builds and puts each route next to the harness's screen at
  phone size (`.shots/compare-<screen>.png`).
- `pnpm build && pnpm preview` serves the built app. Hand that to people, not `pnpm dev`: the dev server
  sends hundreds of separate files and the first load takes seconds.
- `pnpm check:ui [route ...]` checks the same pages: accessibility and contrast (axe, WCAG 2.1 AA),
  sideways overflow, pointer cursor on clickables, visible keyboard focus, console errors.
- `pnpm check:bundle` keeps the gzipped build within `slipway.budget` in package.json.
- `pnpm check:score` runs Lighthouse (performance 90, accessibility/best practices/SEO 95). It needs
  Chrome, so CI runs it (`.github/workflows/verify.yml`); WSL cannot.
- `pnpm audit:deps` fails on high-severity dependency advisories.

## Map

The code follows Feature-Sliced Design: layers from the app down to shared code, each importing only
the layers below it.

| Path | Layer | What lives there |
|---|---|---|
| `src/main.tsx`, `src/index.css`, `src/mocks/` | app | Entry and providers; theme tokens (`pnpm design` rewrites them); the mock backend: `db.ts` (localStorage, demo account), `scenario.ts` (demo data), `handlers/<resource>.ts` |
| `src/routes/` | pages | TanStack Router file routes that compose widgets and features. Ships only the root, an empty `/` and `/auth/callback` (Kakao/Naver landing) |
| `src/widgets/` | widgets | Blocks several pages share (a schedule list, a tab bar) |
| `src/features/<action>/` | features | One thing a user does (take a booking, check attendance): its form, sheet, rules, hooks |
| `src/entities/<resource>/` | entities | `api.ts`: zod schema, queries, mutations, written by `pnpm gen` |
| `src/shared/ui/` | shared | shadcn, every component installed. Don't hand-edit; re-add with `pnpm dlx shadcn add <name> -o` |
| `src/shared/components/` | shared | `kr-inputs` (Korean inputs), `form-field`, `page-header`, `route-states`, `theme-provider` |
| `src/shared/patterns/` | shared | Screen parts: app shell, phone app frame (`mobile-shell`), sign-in forms, theme settings, table, filters, chart, board, form and more (see CODEPACK.md) |
| `src/shared/design/` | shared | `pnpm design` output: the harness's component CSS and `KField`/`KAvatar`/`KTabBar`/`KAppBar` |
| `src/shared/lib/` | shared | `kr.ts` (Korean formatting, validation, dates), `utils`, csv, table and chart models |
| `src/shared/api/` | shared | `client.ts` (fetch, `ApiError`, `failureOf`), `auth.ts` (session hooks, `currentUser`), `demo-account.ts` |
| `src/shared/config.ts` | shared | Product name and copy, `isDemo` flag |
| `docs/requirements.md` | The `REQ-n` list the demo must satisfy |

## Rules

- Layers import downward only: app -> `routes` (pages) -> `widgets` -> `features` -> `entities` ->
  `shared`. ESLint enforces it. Slices on one layer don't import each other (a feature never imports
  another feature); inside a slice use relative paths. Shared code knows no domain. Keep a route file to
  layout and wiring: move a form, a sheet or a rule into its feature.

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

- Mobile apps, meaning screens used mainly on a phone (flutter shells included): k-style-ui-ux
  (`/k-style-ui-ux:go <PRD>`). Its `out/` (screens, palette, type, spacing, components) is the design.
  Don't copy its HTML files into the app; write each screen as JSX with the same markup. In this order:
  1. `pnpm design out` writes its tokens into the theme, its component styles into
     `src/shared/design/k-style.css` with a `k-` prefix, and its images into `public/k-style/`. For the palette
     picked on the canvas add `--palette <slug>` (`seed-mindbody` from `out/palettes.json`). It also
     writes `src/shared/design/k-style.tsx`: `KField` (label, control, error line with aria), `KAvatar` (a
     prepared drawing picked by name; the design never uses initials) and `KTabBar`.
  2. Write each `out/screens/<id>.html` as JSX with the same markup and the prefix (`class="row"` ->
     `className="k-row"`, `chip is-selected` -> `k-chip k-is-selected`):
     - App bar: `KAppBar` (back through `useBack`). Tab bar: `KTabBar` with the items defined once in
       `src/widgets/tabs/`. Dates: `formatDateLong` ("11월 4일 수요일"), `formatDateShort`
       ("11/4 수"), `formatMonthDay` ("11월 4일"), `formatDateWord` ("오늘", "내일") from `@/shared/lib/kr`.
       Sign-in reads `?redirect=` with `safeRedirect()`.
     - Root: `<MobileShell className="k-screen k-has-tab">` with the `<body>`'s classes. The shell is
       the page's `<main>`, so the design's `<main class="page">` becomes `<div className="k-page">`.
     - Keep the design's own app bar, tab bar, bottom CTA and FAB markup (`k-appbar`, `k-tabbar`,
       `k-cta`, `k-fab`); leave MobileShell's `top`/`tabs`/`bottom` props for designs without their own.
       Back buttons call `useBack({ to: "/list" })`; the tab bar is `KTabBar`. The design's inline line
       icons are lucide icons with `strokeWidth={1.75}`.
     - Sheets: `<BottomSheet className="k-sheet" overlayClassName="k-dim">` with the grip and
       `<BottomSheetTitle className="k-h2">` inside. To compare a sheet, open it from a search param.
     - Forms: `KField` around the design's `k-input` (`group` when the control is a button or a set of
       options, so it keeps its own name; `KSeg` for a segment). Keep the inputs' text as the form state and
       check it with the resource's zod schema (number and won fields read "12" and "" themselves); show
       `failureOf(parsed.error)` or `failureOf(error)` from a failed save: field errors through `KField`'s
       `error`, the rest with `<KFormError failure={failure} />` above the button. Sign-in calls the hooks
       in `src/shared/api/auth.ts`: the design's "둘러보기" is `useDemoLogin()` (the seeded demo account),
       `useSocialLogin()` handles the mock and the real redirect.
     - Data from the generated hooks: `<plural>Query` for a page, `all<Plural>Query()` when a screen
       counts or joins across the list, `<singular>Query(id)` for a detail; save one changed value
       with `{ ...to<Single>Input(row), status }`. Images from `/k-style/...`.
     - The home screen under the signed-in layout (`src/routes/_app/index.tsx`) replaces the empty
       `src/routes/index.tsx`: delete that file. Anything the design doesn't draw uses the token utilities
       (`bg-surface`, `text-ink-2`, `text-title`, `h-btn`, ...), never raw colors.
  3. Seed the demo account with the scenario in `out/journey.md`, in `src/mocks/scenario.ts`:
     `demoRow({...})` fills the owner and times; the mock starts over each day, so count dates from
     today with `isoDaysFrom`; invent plausible names where the table only gives counts; give rows
     fixed ids. Avatars need no field: `KAvatar` picks a drawing by name; drawings a journey assigns go
     in a name-to-file map in `src/shared/config.ts` (app code can't import `src/mocks`). List the
     detail routes, and sheets opened by a search param, under `"slipway": { "routes": [...] }` in
     package.json and the screens seen before signing in under `"signedOut": ["/login"]`, so shots and
     check:ui open them too. With the design's light-only theme they take light captures only.
  4. Set the design's moment once as `"slipway": { "now": "2026-11-04T18:50" }` in package.json (shots,
     check:ui and compare freeze the clock there). `pnpm design:compare /route=<id>.html ...` for every screen
     (`--signed-out /login` for screens seen before signing in); fix what differs and repeat until
     they match. `--now` also works for shots and check:ui. To skip the rebuild between rounds run
     `node scripts/ui.mjs compare ...` on the last build.
  E2E: designs hide native radios and checkboxes behind styled labels, so tap the visible label
  (`page.locator("label", { hasText })`) and assert the input is checked. Form and done screens have
  no tab bar; leave them through their own back, close or link. `openAsDemo(page, path, { now })` from
  `e2e/demo.ts` opens a screen as the demo account at the design's moment. A calculation across two
  resources (seats left from classes and bookings) belongs to the feature that shows it.
  A field that points at another resource (a booking's class) is `classId:ref(classes):수업` in
  `pnpm gen`: generate the target first; the mock and API check it and delete with it.
  The parts table in CODEPACK.md (tables, record forms, detail panels) is for designs without their own
  markup; with k-style use MobileShell, useBack, BottomSheet, ConfirmAction and the k- markup.
  A design's `data-stay="…"` is the toast to show after that action (sonner's `toast`).
  `check:ui` checks the last build: run `pnpm build` (or `pnpm verify`) after changing code.
- Desktop web, landing and docs sites: the Impeccable skill (`/impeccable`). Before the first screen it
  captures `PRODUCT.md` and `DESIGN.md` with the user; build screens with it, then `critique` and `polish`.
- If the harness isn't installed, ask the user to install it rather than inventing a style.
- Parts in `src/shared/patterns/` are building blocks: use, edit, restyle or skip them. Theme tokens in
  `src/index.css` are technical defaults for shadcn; the harness rewrites them.
- Never make up a logo, favicon or app icon (a letter in a shape, a stock icon standing in for the brand). Use only the logo file the user supplies: `pnpm brand <file>` puts it in `public/` and makes it the favicon, then pass it to `AppShell`'s `logo`. Until then the product name stands as plain text and you ask the user for a logo.
- Whatever the design, it passes `pnpm check:ui` (accessibility, contrast, focus, overflow, cursor,
  console errors) and the e2e tests. Look at `pnpm shots` before calling a screen done.

Wiring facts (not a layout): sign-in calls the hooks in `src/shared/api/auth.ts`; a layout route's
`beforeLoad` calls `currentUser(context.queryClient)` and redirects when it returns null (only a 401
signs out; other errors show the error screen); each route sets `staticData: { title }`
for the tab and the `AppShell` breadcrumb. Details: CODEPACK.md ("인증 연결").

## Adding a resource

Select independent components from `src/shared/patterns/`. Do not preassemble business
screens or register domain menus/APIs in the base template. Patterns must not import
domain types or API clients.
Read `CODEPACK.md` in a generated project (or `docs/codepack.md` in Slipway).
Define the acceptance criteria first. In a project made by Slipway, `pnpm gen resource <plural> <한글 이름> --fields "..."` writes the data
layer at once (run `node scripts/gen.mjs` for the field syntax). It never writes screens.

1. `src/entities/<resource>/api.ts` holds the schema and queries.
2. `src/mocks/handlers/<resource>.ts` holds the mock endpoints, registered in `src/mocks/browser.ts`;
   the table is in `src/mocks/db.ts`, the demo rows in `src/mocks/scenario.ts`.
3. What users do with it goes in `src/features/<action>/`; the pages in `src/routes/_app/...`,
   including loading, empty, and error states.
4. Add the page to the app's navigation (`AppShell`'s `nav`, `MobileShell`'s `tabs` or the design's tab bar).
5. Add `REQ-n` entries and e2e tests.

Guest sign-in creates a new identity each time. Never assume one global guest ID.
Use the returned user's ID to scope new domain data.
