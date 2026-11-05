import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import test from "node:test"
import { createProject } from "../scripts/create-project.mjs"

// A trimmed k-style tokens file: header comment, font import, :root tokens, the large-text class.
const kstyle = (brand) => `/* foundation tokens — derive.py --brand ${brand}
   이 파일은 생성물이다. */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

:root {
  --c-bg: #F1F6F5;
  --c-surface: #FEFEFE;
  --c-brand: ${brand};
  --fs-title: 28px; --fw-title: 700; --lh-title: 1.36;
  --h-btn: 56px;
}

.text-large { --fs-body: 18px; }
`

async function project(t, preset) {
  const root = await mkdtemp(join(tmpdir(), "slipway-design-test-"))
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    assert.ok(basename(root).startsWith("slipway-design-test-"))
    await rm(root, { recursive: true, force: true })
  })
  const target = join(root, "app")
  await createProject(target, { preset })
  await mkdir(join(root, "out"))
  await writeFile(join(root, "out/tokens.css"), kstyle("#008363"))
  await writeFile(join(root, "out/tokens-seed-classpass.css"), kstyle("#0055FF"))
  await writeFile(join(root, "out/components.css"), `/* foundation components */
* { box-sizing: border-box; margin: 0; }
body {
  color: var(--c-text-1);
}
.block { display: flex; background: var(--c-surface); }
body.has-tab .page, body:has(> .cta) .page { padding-bottom: 64px; }
.tl-body { gap: 4px; }
button { background: none; }
.row-art img { width: 36px; opacity: .45; }
@keyframes spin { to { transform: rotate(360deg); } }
`)
  await mkdir(join(root, "out/assets/avatars/line"), { recursive: true })
  await writeFile(join(root, "out/assets/avatars/line/01.svg"), "<svg/>")
  return target
}

const design = (cwd, ...args) => execFileSync(process.execPath, ["scripts/design.mjs", ...args], { cwd, encoding: "utf8", stdio: "pipe" })

for (const [preset, theme] of [["react", "src/index.css"], ["mono", "apps/web/src/index.css"], ["next", "src/app/globals.css"]]) {
  test(`${preset}: copies the harness tokens into the theme and points shadcn's names at them`, async t => {
    const cwd = await project(t, preset)
    assert.equal(JSON.parse(await readFile(join(cwd, "package.json"), "utf8")).scripts.design, "node scripts/design.mjs")
    assert.match(design(cwd, "../out"), /brand #008363/)
    let css = await readFile(join(cwd, theme), "utf8")
    assert.match(css, /--c-brand: #008363;/)
    assert.match(css, /--primary: var\(--c-brand\);/)
    assert.match(css, /--text-title: var\(--fs-title\);/)
    assert.match(css, /\.text-large \{ --fs-body: 18px; \}/)
    // The template's own brand and dark tokens are gone; the theme still has its base layer.
    assert.doesNotMatch(css, /--brand-h:|^\.dark \{/m)
    assert.doesNotMatch(css, /@import url\('https:\/\/cdn/)
    assert.match(css, /@custom-variant dark \(&:not\(\*\)\);/)
    assert.match(css, /@layer base \{/)

    // The harness's component styles come in prefixed, the reset left to Tailwind; images land in public/.
    const web = preset === "mono" ? "apps/web/" : ""
    const components = await readFile(join(cwd, `${web}src/shared/design/k-style.css`), "utf8")
    assert.match(css, preset === "next" ? /@import "\.\/\.\.\/shared\/design\/k-style\.css";/ : /@import "\.\/shared\/design\/k-style\.css";/)
    assert.match(components, /@layer components \{/)
    assert.match(components, /\.k-block \{ display: flex;/)
    assert.match(components, /\.k-screen\.k-has-tab \.k-page, \.k-screen:has\(> \.k-cta\) \.k-page \{/)
    assert.match(components, /\.k-tl-body \{/)
    assert.match(components, /\.k-row-art img \{ width: 36px; opacity: \.45; \}/)
    assert.match(components, /@keyframes spin \{ to \{/)
    assert.doesNotMatch(components, /^(\*|button|body) \{/m)
    // The base body rule becomes the screen root's defaults; pinned parts stay in the phone column.
    assert.match(components, /^\.k-screen \{\n  color: var\(--c-text-1\);/m)
    assert.match(components, /\.k-tabbar, \.k-cta, \.k-sheet \{ max-width: var\(--shell-width, 480px\);/)
    assert.equal(await readFile(join(cwd, `${web}public/k-style/avatars/line/01.svg`), "utf8"), "<svg/>")
    // The markup every k-style screen repeats, for this preset's router.
    const parts = await readFile(join(cwd, `${web}src/shared/design/k-style.tsx`), "utf8")
    assert.match(parts, /export function KField\(/)
    assert.match(parts, /export function KAvatar\(/)
    assert.match(parts, /"line":\["01\.svg"\]/)
    assert.match(parts, preset === "next" ? /from "next\/link"/ : /from "@tanstack\/react-router"/)
    assert.match(parts, /export function KFormError\(/)
    // Assigned drawings are a setting KAvatar reads; added once.
    const config = () => readFile(join(cwd, `${web}src/shared/config.ts`), "utf8")
    assert.match(await config(), /export const avatarFiles: Record<string, string> = \{\}/)

    // Rerunning with another palette replaces the block instead of adding one.
    design(cwd, "../out", "--palette", "seed-classpass")
    css = await readFile(join(cwd, theme), "utf8")
    assert.equal(css.match(/design:start/g).length, 1)
    assert.equal(css.match(/shared\/design\/k-style\.css/g).length, 1)
    assert.equal((await config()).match(/avatarFiles/g).length, 1)
    assert.match(css, /--c-brand: #0055FF;/)
    assert.doesNotMatch(css, /#008363/)
  })
}

test("refuses a folder without k-style tokens and presets without a Tailwind theme", async t => {
  const cwd = await project(t, "react")
  assert.throws(() => design(cwd, "../nope"), /not found/)
  await writeFile(join(cwd, "../out/tokens.css"), ":root { --x: 1; }")
  assert.throws(() => design(cwd, "../out"), /not a k-style tokens file/)
  const astro = await project(t, "astro")
  assert.equal(JSON.parse(await readFile(join(astro, "package.json"), "utf8")).scripts.design, undefined)
})
