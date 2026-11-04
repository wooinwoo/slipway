import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import test from "node:test"
import { createProject } from "../scripts/create-project.mjs"

async function project(t, preset) {
  const root = await mkdtemp(join(tmpdir(), "slipway-brand-test-"))
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    assert.ok(basename(root).startsWith("slipway-brand-test-"))
    await rm(root, { recursive: true, force: true })
  })
  const target = join(root, "app")
  await createProject(target, { preset })
  await writeFile(join(root, "logo.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>')
  await writeFile(join(root, "logo.png"), "png")
  return target
}

const brand = (cwd, file) => execFileSync(process.execPath, ["scripts/brand.mjs", file], { cwd, encoding: "utf8", stdio: "pipe" })
const read = (cwd, file) => readFile(join(cwd, file), "utf8")

for (const [preset, html] of [["react", "index.html"], ["mono", "apps/web/index.html"], ["astro", "src/layouts/Base.astro"]]) {
  test(`${preset}: copies the user's logo and sets one favicon link`, async t => {
    const cwd = await project(t, preset)
    assert.equal(JSON.parse(await read(cwd, "package.json")).scripts.brand, "node scripts/brand.mjs")
    assert.match(brand(cwd, "../logo.svg"), /<AppShell logo=\{<img src="\/logo\.svg" alt="" \/>\}/)
    assert.match(await read(cwd, html), /<link rel="icon" href="\/logo\.svg" type="image\/svg\+xml" \/>\n\s*<\/head>/)
    // A second logo replaces the first: one file, one link.
    brand(cwd, "../logo.png")
    const page = await read(cwd, html)
    assert.equal(page.match(/rel="icon"/g).length, 1)
    assert.match(page, /href="\/logo\.png" type="image\/png"/)
    const publicDir = join(cwd, preset === "mono" ? "apps/web/public" : "public")
    assert.deepEqual((await readdir(publicDir)).filter(f => f.startsWith("logo")), ["logo.png"])
  })
}

test("next: uses the app/icon file convention", async t => {
  const cwd = await project(t, "next")
  brand(cwd, "../logo.svg")
  assert.ok((await readdir(join(cwd, "src/app"))).includes("icon.svg"))
  assert.ok((await readdir(join(cwd, "public"))).includes("logo.svg"))
})

test("refuses SVGs with scripts and projects without a web app", async t => {
  const cwd = await project(t, "react")
  await writeFile(join(cwd, "../bad.svg"), '<svg onload="alert(1)"></svg>')
  assert.throws(() => brand(cwd, "../bad.svg"), /scripts or event handlers/)
  assert.ok(!(await readdir(join(cwd, "public"))).includes("logo.svg"))
  const api = await project(t, "nest")
  assert.equal(JSON.parse(await read(api, "package.json")).scripts.brand, undefined)
})
