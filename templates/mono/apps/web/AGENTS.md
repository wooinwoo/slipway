# Slipway Mono: web

The web app of the Slipway monorepo (read `../../AGENTS.md` first). By default it talks to
`apps/api` on the same origin; `pnpm dev:demo` swaps in the in-browser mock backend (MSW).

## Commands

- `pnpm dev` starts http://localhost:5173.
- `pnpm verify` runs typecheck, lint, unit tests, the requirements check, build, and e2e.
  Run it before reporting a task as done. Fix the cause of a failure; do not weaken a check.

## Map

| Path | What lives there |
|---|---|
| `src/config.ts` | Product name and copy, `isDemo` flag |
| `src/patterns/` | Domain-independent table, form, details, board and metric patterns |
| `src/index.css` | Theme tokens. `--brand-h` and `--brand-c` re-skin the whole app |
| `src/api/<resource>.ts` | zod schema, types, query options, mutations for one resource |
| `src/mocks/` | Mock backend: `db.ts` (localStorage and initial demo account), `handlers/<resource>.ts` |
| `src/routes/` | TanStack Router file routes. Everything under `_app/` requires login |
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

## Adding a resource

Select independent components from `src/patterns/`. Do not preassemble business
screens or register domain menus/APIs in the base template. Patterns must not import
domain types or API clients.
Read `CODEPACK.md` in a generated project (or `docs/codepack.md` in Slipway).
There is no automatic resource generator. Define the acceptance criteria first.

1. `src/api/<resource>.ts` holds the schema and queries.
2. `src/mocks/handlers/<resource>.ts` holds the endpoints. Register it in `src/mocks/browser.ts`,
   and add the table and seed rows in `src/mocks/db.ts`.
3. `src/routes/_app/<resource>/` holds the pages, including loading, empty, and error states.
4. Add the page to `nav` in `src/components/app-sidebar.tsx`.
5. Add `REQ-n` entries and e2e tests.

Guest sign-in creates a new identity each time. Never assume one global guest ID.
Use the returned user's ID to scope new domain data.
