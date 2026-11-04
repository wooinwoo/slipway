# Slipway Astro

Static site setup for landing, service introduction and documentation pages. It ships no pages or
sections; build them per project. Pages are HTML at build time; React islands add interactivity
where a page needs it.

For deploying, follow `.claude/skills/deploy/SKILL.md`.

## Commands

- `pnpm dev` starts http://localhost:4321.
- `pnpm verify` runs `astro check`, build, smoke e2e and the UI check. Run it before reporting a task
  as done. Fix the cause of a failure; do not weaken a check.
- `pnpm shots [path ...]` builds and screenshots pages (desktop and mobile, light and dark) into
  `.shots/`. Open the images before calling UI work done.
- `pnpm check:ui [path ...]` checks the built pages: accessibility and contrast (axe, WCAG 2.1 AA),
  sideways overflow, pointer cursor on clickables, visible keyboard focus, console errors.
- `pnpm check:score` runs Lighthouse (95 in every category). It needs Chrome, so CI runs it.
- `pnpm audit:deps` fails on high-severity dependency advisories.

## Map

| Path | What lives there |
|---|---|
| `src/config.ts` | Site name, tagline, Open Graph image |
| `src/styles/global.css` | Theme tokens shared with the React preset. `--brand-h` and `--brand-c` re-skin the site |
| `src/layouts/Base.astro` | `<html lang="ko">`, title, description, canonical, Open Graph. Every page uses it |
| `src/pages/` | One file per URL. `404.astro` is the not-found page; `robots.txt.ts` points at the sitemap |
| `astro.config.mjs` | `SITE_URL`, React islands, sitemap, the hashed Content-Security-Policy |
| `public/_headers`, `vercel.json` | Security headers for static hosts |

## Rules

- Read `PRODUCT.md` (who, why, tone) and `DESIGN.md` (tokens, type, layout) before building a page.
  Use the Impeccable skill for design work when it is available. Both are a starting point: for a
  different look, rewrite `DESIGN.md` and `src/styles/global.css` first. The quality gates stay fixed.
- Every page passes `title` and `description` to `Base`. One `<h1>` per page.
- Images go through `astro:assets` (`<Image>`) with `alt` text and explicit sizes.
- Ship HTML first. Use a React island (`client:visible`, `client:idle`) only where the page needs
  interaction. Slipway parts copy in with `node <slipway>/scripts/pack.mjs copy <part> --to src`.
- No inline `<script>` or `style=""` that Astro doesn't hash: the CSP blocks them. Put scripts in
  `<script>` tags Astro processes, styles in classes.
- UI copy is Korean, short, and plain.
