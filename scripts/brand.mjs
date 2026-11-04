// pnpm brand <logo.svg|logo.png|logo.ico>
//
// Wires the product's real logo, supplied by the user, into the project: copies it to public/logo.<ext>
// and makes it the favicon. It never draws or generates a logo. Show it in the app frame with
// `<AppShell logo={<img src="/logo.svg" alt="" />} ...>` (alt is empty: the name stands next to it).
//   react, mono:  public/logo.<ext> + <link rel="icon"> in index.html
//   next:         public/logo.<ext> + src/app/icon.<ext> (Next's file convention writes the icon link)
//   astro:        public/logo.<ext> + <link rel="icon"> in src/layouts/Base.astro
// Store app icons (Flutter) need sized PNGs: use flutter_launcher_icons with the same file.
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { extname, join } from "node:path"

const types = { ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" }

const layout = existsSync("apps/web/index.html") ? { public: "apps/web/public", html: "apps/web/index.html" }
  : existsSync("src/app/layout.tsx") ? { public: "public", appIcon: "src/app" }
  : existsSync("src/layouts/Base.astro") ? { public: "public", html: "src/layouts/Base.astro" }
  : existsSync("index.html") ? { public: "public", html: "index.html" }
  : null
if (!layout) exit("Run this in the root of a Slipway web project (react, next, mono or astro).")

const [file] = process.argv.slice(2)
if (!file || !existsSync(file)) exit("usage: pnpm brand <logo.svg|logo.png|logo.ico> (the product's own logo file)")
const ext = extname(file).toLowerCase()
if (!types[ext]) exit("The logo must be .svg, .png or .ico.")
// Opened directly, an SVG runs its scripts on this origin. A logo needs none.
if (ext === ".svg" && /<script|\son\w+\s*=|javascript:/i.test(readFileSync(file, "utf8"))) {
  exit("This SVG contains scripts or event handlers. Export a plain SVG from the design tool.")
}

// One logo at a time: a previous logo in another format would linger as a stale file.
for (const old of Object.keys(types)) rmSync(join(layout.public, `logo${old}`), { force: true })
copyFileSync(file, join(layout.public, `logo${ext}`))

if (layout.appIcon) {
  for (const old of Object.keys(types)) rmSync(join(layout.appIcon, `icon${old}`), { force: true })
  copyFileSync(file, join(layout.appIcon, `icon${ext}`))
} else {
  const link = `<link rel="icon" href="/logo${ext}" type="${types[ext]}" />`
  const html = readFileSync(layout.html, "utf8")
  const updated = /<link rel="icon"[^>]*>/.test(html)
    ? html.replace(/<link rel="icon"[^>]*>/, link)
    : html.replace(/(\n(\s*)<\/head>)/, `\n$2  ${link}$1`)
  if (updated === html && !html.includes(link)) exit(`${layout.html}: no </head> to add the icon link to.`)
  writeFileSync(layout.html, updated)
}

console.log(`Logo: ${join(layout.public, `logo${ext}`)}, favicon set.`)
console.log(`App frame: <AppShell logo={<img src="/logo${ext}" alt="" />} ...>`)

function exit(message) {
  console.error(message)
  process.exit(1)
}
