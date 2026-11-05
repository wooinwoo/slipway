// pnpm design <k-style out dir> [--palette <name>]
//
// Puts the design harness's tokens into the project's theme, so screens built from the parts and
// shadcn components take the harness's colors, type, spacing and shape. It copies values; it never
// picks them. Today it reads k-style-ui-ux output (`out/tokens.css`, or `out/tokens-seed-<name>.css`
// for the palette chosen on the canvas). Rerun it after the palette or tokens change.
//
// What lands in the theme CSS (src/index.css, apps/web/src/index.css or src/app/globals.css):
//   - the harness tokens as they are (--c-bg, --fs-title, --h-btn, ...)
//   - shadcn's names pointed at them (--background, --primary, --border, --radius, ...)
//   - Tailwind utilities for them: bg-surface, bg-fill, text-ink-2, text-title, h-btn, px-page-x,
//     rounded-control, shadow-high, ... (listed in the block it writes)
// Light only: the harness draws no dark scheme, so the `dark:` variant is switched off.
//
// It also brings the harness's component styles (`out/components.css`, which use only those tokens)
// in as `src/shared/design/k-style.css`, every class prefixed `k-` so none collides with Tailwind (`.block`,
// `.row`, `.chip` become `k-block`, `k-row`, `k-chip`; `<body class>` becomes the screen root's
// `k-screen` class). A screen is then `out/screens/<id>.html` written as JSX: the same classes with the
// prefix, data from the hooks, behavior from the parts. Its images (`out/assets`) go to `public/k-style/`.
// `src/shared/design/k-style.tsx` gets the markup every k-style screen repeats: KField (label, control
// and error line wired for screen readers), KFormError, KSeg, KAvatar (a prepared drawing picked by name), KAppBar
// and KTabBar.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"

const theme = ["apps/web/src/index.css", "src/app/globals.css", "src/index.css"].find((file) => existsSync(file))
if (!theme) exit("Run this in the root of a Slipway web project with a Tailwind theme (react, next or mono).")

const args = process.argv.slice(2)
const paletteAt = args.indexOf("--palette")
const palette = paletteAt >= 0 ? args.splice(paletteAt, 2)[1] : null
const [dir] = args
if (!dir) exit("usage: pnpm design <k-style out dir> [--palette <name>]")
// palettes.json lists them as "seed-mindbody"; the file is tokens-seed-mindbody.css. Take either name.
const source = join(dir, palette ? `tokens-seed-${palette.replace(/^seed-/, "")}.css` : "tokens.css")
if (!existsSync(source)) exit(`${source} not found. Point at the k-style out/ folder${palette ? " and a palette from its palettes.json" : ""}.`)

// Everything but the header comment and the font @import (the template already ships Pretendard).
const tokens = readFileSync(source, "utf8")
  .replace(/\r\n/g, "\n")
  .replace(/^\/\*[\s\S]*?\*\/\s*/, "")
  .replace(/^@import[^\n]*\n/gm, "")
  .trim()
if (!/--c-brand:/.test(tokens)) exit(`${source} has no --c-brand: not a k-style tokens file.`)

const START = "/* design:start"
const END = "/* design:end */"
const block = `${START} — k-style-ui-ux tokens from ${source} (pnpm design). Rerun it instead of editing. */
${tokens}

/* shadcn names, pointed at the harness tokens, so dialogs, drawers, inputs and toasts match */
:root {
    --background: var(--c-bg);
    --foreground: var(--c-text-1);
    --card: var(--c-surface);
    --card-foreground: var(--c-text-1);
    --popover: var(--c-surface);
    --popover-foreground: var(--c-text-1);
    --primary: var(--c-brand);
    --primary-foreground: var(--c-on-brand);
    --secondary: var(--c-bg);
    --secondary-foreground: var(--c-text-1);
    --muted: var(--c-bg);
    --muted-foreground: var(--c-text-2);
    --accent: var(--c-brand-tint);
    --accent-foreground: var(--c-brand-tint-text);
    --destructive: var(--c-danger);
    --border: var(--c-line);
    --input: var(--c-line-strong);
    --ring: var(--c-focus);
    --chart-1: var(--c-brand);
    --chart-2: var(--c-info);
    --chart-3: var(--c-warning);
    --chart-4: var(--c-success);
    --chart-5: var(--c-text-3);
    --radius: var(--r-m);
    --sidebar: var(--c-surface);
    --sidebar-foreground: var(--c-text-1);
    --sidebar-primary: var(--c-brand);
    --sidebar-primary-foreground: var(--c-on-brand);
    --sidebar-accent: var(--c-bg);
    --sidebar-accent-foreground: var(--c-text-1);
    --sidebar-border: var(--c-line);
    --sidebar-ring: var(--c-focus);
    /* The template ships Pretendard as a variable font under this name. */
    --font: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

/* Filled controls (inputs, search, secondary buttons: bg-fill) are white on the page background and
   turn background-colored inside a white panel. Mark white panels with data-surface. */
body { --c-fill: var(--c-surface); letter-spacing: var(--tracking); }
[data-surface], [data-slot="drawer-content"], [data-slot="dialog-content"], [data-slot="sheet-content"] { --c-fill: var(--c-bg); }
[data-slot="drawer-overlay"], [data-slot="dialog-overlay"], [data-slot="sheet-overlay"] { background: var(--c-overlay); }

@theme inline {
    --text-title: var(--fs-title); --text-title--line-height: var(--lh-title); --text-title--font-weight: var(--fw-title);
    --text-h2: var(--fs-h2); --text-h2--line-height: var(--lh-h2); --text-h2--font-weight: var(--fw-h2);
    --text-body: var(--fs-body); --text-body--line-height: var(--lh-body);
    --text-strong: var(--fs-strong); --text-strong--line-height: var(--lh-strong); --text-strong--font-weight: var(--fw-strong);
    --text-sub: var(--fs-sub); --text-sub--line-height: var(--lh-sub);
    --text-caption: var(--fs-caption); --text-caption--line-height: var(--lh-caption); --text-caption--font-weight: var(--fw-caption);
    --color-surface: var(--c-surface);
    --color-fill: var(--c-fill);
    --color-line: var(--c-line);
    --color-line-strong: var(--c-line-strong);
    --color-ink: var(--c-text-1);
    --color-ink-2: var(--c-text-2);
    --color-ink-3: var(--c-text-3);
    --color-ink-disabled: var(--c-text-disabled);
    --color-disabled: var(--c-disabled-bg);
    --color-overlay: var(--c-overlay);
    --color-brand: var(--c-brand);
    --color-brand-text: var(--c-brand-text);
    --color-brand-pressed: var(--c-brand-pressed);
    --color-brand-tint: var(--c-brand-tint);
    --color-brand-tint-text: var(--c-brand-tint-text);
    --color-danger-tint: var(--c-danger-tint);
    --color-danger-tint-text: var(--c-danger-tint-text);
    --color-success: var(--c-success);
    --color-success-tint: var(--c-success-tint);
    --color-success-tint-text: var(--c-success-tint-text);
    --color-warning: var(--c-warning);
    --color-warning-tint: var(--c-warning-tint);
    --color-warning-tint-text: var(--c-warning-tint-text);
    --color-info: var(--c-info);
    --color-info-tint: var(--c-info-tint);
    --color-info-tint-text: var(--c-info-tint-text);
    --shadow-low: var(--shadow-1);
    --shadow-high: var(--shadow-2);
    --spacing-page-x: var(--page-x);
    --spacing-block-pad: var(--block-pad);
    --spacing-block-gap: var(--block-gap);
    --spacing-row-py: var(--row-py);
    --spacing-stack-s: var(--stack-s);
    --spacing-stack-m: var(--stack-m);
    --spacing-stack-l: var(--stack-l);
    --spacing-appbar: var(--h-appbar);
    --spacing-btn: var(--h-btn);
    --spacing-btn-s: var(--h-btn-s);
    --spacing-tab: var(--h-tab);
    --spacing-row: var(--h-row);
    --spacing-icon: var(--icon);
    --radius-tag: var(--r-s);
    --radius-control: var(--r-m);
    --radius-panel: var(--r-l);
    --radius-pill: var(--r-pill);
}
${END}`

// Component styles: drop the reset (Tailwind's preflight covers it) and prefix every class.
const componentsFile = join(dir, "components.css")
// The harness's styles and markup are shared UI: src/shared/design/ next to src/shared/ui (shadcn).
const designCss = join(existsSync("apps/web/src") ? "apps/web/src" : "src", "shared/design/k-style.css")
if (existsSync(componentsFile)) {
  const raw = readFileSync(componentsFile, "utf8").replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "")
  // From the base body rule on: the earlier lines are the universal and html resets.
  const body = raw.slice(raw.search(/\nbody\s*\{/) + 1)
  mkdirSync(dirname(designCss), { recursive: true })
  writeFileSync(designCss, `/* k-style-ui-ux component styles from ${componentsFile} (pnpm design). Rerun it instead of editing.
   Classes carry a k- prefix; the screen root is .k-screen (the design's <body>). */
@layer components {
:where([class^="k-"], [class*=" k-"]) svg { display: block; flex: none; width: 24px; height: 24px; }
${prefixSelectors(body).trim()}

/* The app is a phone-width column on wide screens (MobileShell): pinned parts stay inside it. */
.k-tabbar, .k-cta, .k-sheet { max-width: var(--shell-width, 480px); margin-inline: auto; }
.k-toast { max-width: calc(var(--shell-width, 480px) - 2 * var(--page-x)); margin-inline: auto; }
.k-fab { right: max(var(--page-x), calc((100vw - var(--shell-width, 480px)) / 2 + var(--page-x))); }
}
`)
  const assets = join(dir, "assets")
  const publicDir = existsSync("apps/web/public") ? "apps/web/public" : "public"
  if (existsSync(assets)) cpSync(assets, join(publicDir, "k-style"), { recursive: true })
  const avatarsDir = join(assets, "avatars")
  const avatars = existsSync(avatarsDir)
    ? Object.fromEntries(readdirSync(avatarsDir, { withFileTypes: true }).filter((d) => d.isDirectory())
      .map((d) => [d.name, readdirSync(join(avatarsDir, d.name)).filter((f) => /\.(svg|png|webp)$/.test(f)).sort()]))
    : {}
  writeFileSync(join(dirname(designCss), "k-style.tsx"), kStyleParts(theme.endsWith("globals.css") ? "next" : "tanstack", avatars))
}

let css = readFileSync(theme, "utf8").replace(/\r\n/g, "\n")
if (css.includes(START)) {
  css = css.slice(0, css.indexOf(START)) + block + css.slice(css.indexOf(END) + END.length)
} else {
  // First run: the template's default brand and dark tokens make way for the harness's.
  const from = css.indexOf("/* Brand: change these two numbers")
  const to = css.indexOf("@layer base {")
  if (from < 0 || to < from) exit(`${theme}: can't find the template's brand tokens. Add the markers "${START} */" and "${END}" where the tokens go.`)
  css = css.slice(0, from) + block + "\n\n" + css.slice(to)
}
if (existsSync(designCss)) {
  const line = `@import "./${relative(dirname(theme), designCss).replace(/\\/g, "/")}";`
  if (!css.includes(line)) css = css.replace(/(@import "shadcn\/tailwind\.css";\n)/, `$1${line}\n`)
}
css = css.replace("@custom-variant dark (&:is(.dark *));", "@custom-variant dark (&:not(*)); /* the harness design has no dark scheme */")
writeFileSync(theme, css)

const brand = /--c-brand:\s*([^;]+);/.exec(tokens)[1]
console.log(`Wrote the k-style tokens${palette ? ` (palette ${palette})` : ""} into ${theme}: brand ${brand}.`)
console.log("Utilities: bg-surface bg-fill text-ink text-ink-2 text-title text-h2 text-sub h-btn h-btn-s px-page-x rounded-control shadow-high ...")
if (existsSync(designCss)) console.log(`Component styles in ${designCss} (k-row, k-chip, k-btn k-primary, ...), images in public/k-style/.`)
console.log("Look at the result with `pnpm shots`, and compare it with the harness screens: `pnpm design:compare`.")

/** Source of src/shared/design/k-style.tsx: markup the k-style screens repeat, bound to the k- classes. */
function kStyleParts(router, avatars) {
  const link = router === "next"
    ? `import Link from "next/link"\nimport { usePathname } from "next/navigation"`
    : `import { Link, type LinkProps, type NavigateOptions } from "@tanstack/react-router"`
  const backType = router === "next" ? "string" : "NavigateOptions"
  const backHome = router === "next" ? `"/"` : `{ to: "/" }`
  const tabBar = router === "next"
    ? `export function KTabBar({ items }: { items: readonly { to: string; label: string; icon: ReactNode }[] }) {
  const pathname = usePathname()
  return (
    <nav className="k-tabbar" aria-label="메뉴">
      {items.map(({ to, label, icon }) => (
        <Link key={label} href={to} className="k-tab" aria-current={(to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(\`\${to}/\`)) ? "page" : undefined}>
          {icon}
          {label}
        </Link>
      ))}
    </nav>
  )
}`
    : `export function KTabBar({ items }: { items: readonly { to: NonNullable<LinkProps["to"]>; label: string; icon: ReactNode }[] }) {
  return (
    <nav className="k-tabbar" aria-label="메뉴">
      {items.map(({ to, label, icon }) => (
        <Link key={label} to={to} className="k-tab" activeOptions={{ exact: to === "/" }}>
          {icon}
          {label}
        </Link>
      ))}
    </nav>
  )
}`
  return `${router === "next" ? '"use client"\n\n' : ""}// Generated by \`pnpm design\` from the k-style output: markup its screens repeat, bound to the k- classes
// in k-style.css. Rerun it instead of editing; copy a part into src/shared/components to change it for good.
${link}
import { ChevronLeftIcon, CircleAlertIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { useBack } from "@/shared/patterns/mobile-shell"

/** The prepared avatar drawings in public/k-style/avatars, by style. */
const avatars: Record<string, string[]> = ${JSON.stringify(avatars)}

/**
 * A person's avatar: one of the prepared drawings, the one the scenario assigns (\`file\`) or else picked
 * from the name so a member always gets the same face. The design never draws initials or objects in a
 * person's place.
 */
export function KAvatar({ name, kind = "line", file: chosen }: { name: string; kind?: string; /** A drawing the scenario assigns ("02.svg"). */ file?: string }) {
  const files = avatars[kind] ?? []
  const file = chosen ?? files[[...name].reduce((hash, char) => (hash * 31 + char.codePointAt(0)!) >>> 0, 7) % Math.max(files.length, 1)]
  return <span className="k-avatar">{file && <img src={\`/k-style/avatars/\${kind}/\${file}\`} alt="" />}</span>
}

/**
 * A form field: label, the control and the error line under it (k-field, k-field-msg). The control gets
 * the id and the aria attributes that tie the message to it.
 * \`<KField id="name" label="회원 이름" error={failure.fields.memberName}>{(props) => <input className="k-input" {...props} />}</KField>\`
 * When the control is a button, a row or a set of options (a class picker, a segment), pass \`group\`:
 * the label then names the group and the control keeps its own name.
 */
export function KField({
  id,
  label,
  error,
  group,
  children,
}: {
  id: string
  label: ReactNode
  error?: string
  group?: boolean
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode
}) {
  return (
    <div className={cn("k-field", error && "k-is-error")} role={group ? "group" : undefined} aria-labelledby={group ? \`\${id}-label\` : undefined}>
      {group ? (
        <span id={\`\${id}-label\`} className="k-label">
          {label}
        </span>
      ) : (
        <label className="k-label" htmlFor={id}>
          {label}
        </label>
      )}
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? \`\${id}-error\` : undefined })}
      {error && (
        <p id={\`\${id}-error\`} className="k-field-msg">
          <CircleAlertIcon strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The form's own error line, for a failure no field shows (no connection, a server rule): place it above the
 * submit button. Field errors stay under their fields, so this renders only when there are none.
 * \`<KFormError failure={failure} />\` with \`failure\` from \`failureOf\`.
 */
export function KFormError({ failure }: { failure?: { message: string; fields: Record<string, string> } | null }) {
  if (!failure || Object.keys(failure.fields).length) return null
  return (
    <p role="alert" className="k-field-msg">
      <CircleAlertIcon strokeWidth={1.75} aria-hidden />
      {failure.message}
    </p>
  )
}

/**
 * A segmented choice (k-seg): native radios, so arrow keys move between options and a form reads the value.
 * Put it inside \`<KField group>\` for its label. In e2e, tap the visible option:
 * \`page.locator("label", { hasText: "중급" }).click()\`.
 */
export function KSeg<T extends string>({ name, options, value, onChange }: { name: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="k-seg">
      {options.map((option) => (
        <label key={option} className={cn("k-seg-item has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary", value === option && "k-is-selected")}>
          <input type="radio" className="sr-only" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
          {option}
        </label>
      ))}
    </div>
  )
}

/**
 * The top app bar (k-appbar): back, the screen's title as its h1, and an optional end slot (close, save).
 * Back returns to the previous page, or goes to \`back\` when the screen was opened directly.
 */
export function KAppBar({ title, back, end }: { title?: ReactNode; back?: ${backType}; end?: ReactNode }) {
  const goBack = useBack(back ?? ${backHome})
  return (
    <header className="k-appbar">
      {back ? (
        <button type="button" className="k-appbar-btn" aria-label="뒤로" onClick={goBack}>
          <ChevronLeftIcon strokeWidth={1.75} aria-hidden />
        </button>
      ) : (
        <span />
      )}
      {title ? <h1 className="k-appbar-title">{title}</h1> : <span />}
      {end ?? <span />}
    </header>
  )
}

/**
 * The bottom tab bar (k-tabbar). Define the items once (e.g. \`src/routes/_app/-tabs.tsx\`) and render
 * it on each tab screen. Icons: lucide line icons with \`strokeWidth={1.75}\`, like the design's.
 */
${tabBar}
`
}

/** Prefixes the classes in every selector with `k-` and maps `body` to the screen root `.k-screen`. */
function prefixSelectors(text) {
  // Element-only rules (button, a, ul, svg resets) repeat Tailwind's preflight; a scoped svg rule replaces
  // them. The body rule stays: it holds the screen's defaults (text size, --c-fill, --c-track) for .k-screen.
  const rules = text.replace(/^(?!body\b)[a-z*][\w\s,*-]*\{[^}]*\}\n?/gm, "")
  // Plain CSS (no nesting): the text before each "{" is a selector or an at-rule prelude.
  return rules.replace(/([^{};]*)\{/g, (all, prelude) => {
    const head = prelude.trim()
    if (head.startsWith("@") || /^(from|to|\d)/.test(head)) return all
    const selector = prelude.replace(/(^|[\s,>+~(])body(?![\w-])/g, "$1.k-screen").replace(/\.(-?[_a-zA-Z][\w-]*)/g, (match, name) => (name === "k-screen" ? match : `.k-${name}`))
    return `${selector}{`
  })
}

function exit(message) {
  console.error(message)
  process.exit(1)
}
