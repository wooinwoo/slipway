import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { createProject } from "../scripts/create-project.mjs"

async function sandbox(t) {
  const root = await mkdtemp(join(tmpdir(), "slipway-create-test-"))
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    assert.ok(basename(root).startsWith("slipway-create-test-"))
    await rm(root, { recursive: true, force: true })
  })
  return root
}

test("creates an independent mono project with branding and safe defaults", async t => {
  const root = await sandbox(t)
  const target = join(root, "my-service")
  await createProject(target, { preset: "mono", name: '내 "서비스"', tagline: "첫 번째 제품" })
  const manifest = JSON.parse(await readFile(join(target, "package.json"), "utf8"))
  assert.equal(manifest.name, "my-service")
  assert.equal(manifest.packageManager, "pnpm@10.33.2")
  const config = await readFile(join(target, "apps/web/src/config.ts"), "utf8")
  assert.ok(config.includes(JSON.stringify('내 "서비스"')))
  assert.ok(config.includes('"첫 번째 제품"'))
  assert.match(await readFile(join(target, "apps/web/.env"), "utf8"), /VITE_API_URL=\//)
  assert.match(await readFile(join(target, "README.md"), "utf8"), /DEMO=false/)
  assert.match(await readFile(join(target, "README.md"), "utf8"), /--filter @slipway\/web exec playwright install firefox/)
  assert.ok((await readdir(target)).includes("FEATURE-WORKFLOW.md"))
  assert.ok((await readdir(target)).includes("CODEPACK.md"))
  assert.match(await readFile(join(target, "apps/web/index.html"), "utf8"), /<title>내 &quot;서비스&quot;<\/title>/)
  assert.match(await readFile(join(target, "PRODUCT.md"), "utf8"), /^# Product\n\n내 "서비스": 첫 번째 제품/)
  for (const file of ["PRODUCT.md", "DEPLOY.md", "SECURITY.md", "Dockerfile", "Dockerfile.api", "compose.yaml", ".dockerignore"]) assert.ok((await readdir(target)).includes(file), file)
  assert.ok((await readdir(target)).includes("pnpm-lock.yaml"))
  const files = await readdir(target, { recursive: true })
  assert.ok(!files.some(p => /(^|[\\/])(node_modules|dist|\.data|\.git|test-results)([\\/]|$)/.test(p)))
})

test("creates standalone React and Nest presets", async t => {
  const root = await sandbox(t)
  for (const preset of ["react", "nest"]) {
    const target = join(root, `my-${preset}`)
    await createProject(target, { preset })
    assert.equal(JSON.parse(await readFile(join(target, "package.json"), "utf8")).name, `my-${preset}`)
    assert.ok((await readdir(target)).includes("AGENTS.md"))
  }
})

test("defaults to a React demo with no backend setup", async t => {
  const root = await sandbox(t)
  const target = join(root, "quick-demo")
  const result = await createProject(target)
  assert.equal(result.preset, "react")
  const manifest = JSON.parse(await readFile(join(target, "package.json"), "utf8"))
  assert.ok(manifest.dependencies.react)
  assert.equal(manifest.dependencies.turbo, undefined)
  assert.match(await readFile(join(target, "README.md"), "utf8"), /Mock API로 실행/)
  assert.ok(!(await readdir(target)).includes("apps"))
  const patterns = await readdir(join(target, "src/patterns"))
  assert.ok(patterns.includes("data-table.tsx"))
  for (const file of patterns) {
    const source = await readFile(join(target, "src/patterns", file), "utf8")
    assert.doesNotMatch(source, /from ["']@\/(api|features|contracts)\//)
  }
  // Screens are assembled per project; the template ships only the router frame.
  assert.deepEqual((await readdir(join(target, "src/routes"))).sort(), ["__root.tsx", "auth", "index.tsx"])
})

test("never overwrites an existing directory or file", async t => {
  const root = await sandbox(t)
  const existing = join(root, "existing")
  await writeFile(existing, "keep me")
  await assert.rejects(createProject(existing), /이미 있습니다/)
  assert.equal(await readFile(existing, "utf8"), "keep me")
  await createProject(join(root, "my-app"), { preset: "nest" })
  await assert.rejects(createProject(join(root, "my-app")), /이미 있습니다/)
})

test("rejects invalid presets and package names before writing", async t => {
  const root = await sandbox(t)
  await assert.rejects(createProject(join(root, "valid"), { preset: "next" }), /프리셋/)
  await assert.rejects(createProject(join(root, "Invalid Name")), /폴더 이름/)
  assert.deepEqual(await readdir(root), [])
})

test("rejects output inside a template to prevent recursive copies", async () => {
  const target = new URL("../templates/react/my-app", import.meta.url)
  await assert.rejects(createProject(fileURLToPath(target)), /템플릿 폴더/)
})
