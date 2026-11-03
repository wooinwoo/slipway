import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { checkCatalog, copyParts, listParts, planParts } from "../scripts/pack.mjs"

async function sandbox(t) {
  const root = await mkdtemp(join(tmpdir(), "slipway-parts-test-"))
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    assert.ok(basename(root).startsWith("slipway-parts-test-"))
    await rm(root, { recursive: true, force: true })
  })
  return root
}

test("catalog entries have usable contracts, public exports and resolvable dependencies", async () => {
  const result = await checkCatalog()
  assert.equal(result.parts, 20)
  assert.equal(result.parts, listParts().length)
})

test("a board stays independent from the form, router and business logic", async () => {
  const plan = await planParts(["board"])
  assert.ok(plan.files.some(file => file.path === "patterns/status-board.tsx"))
  assert.ok(!plan.files.some(file => /routes\/|features\/|mocks\/|record-form|main\.tsx|config\.ts/.test(file.path)))
  assert.equal(plan.packages["@tanstack/react-router"], undefined)
  assert.ok(plan.packages["radix-ui"])
})

test("selected files copy idempotently and metadata preserves prior style requirements", async t => {
  const root = await sandbox(t)
  const target = join(root, "src")
  const first = await copyParts(["table", "metrics"], target)
  assert.ok(first.copied.includes("styles/slipway.css"))
  assert.equal(first.files.filter(name => name === "components/ui/button.tsx").length, 1)
  assert.ok(!first.files.some(name => /routes\/|mocks\/|main\.tsx/.test(name)))
  const second = await copyParts(["table"], target)
  assert.equal(second.copied.length, 0)
  assert.ok(second.skipped.length > 0)
  await copyParts(["kr-format"], target)
  const record = JSON.parse(await readFile(join(target, "slipway-parts.json"), "utf8"))
  assert.deepEqual(record.parts, ["kr-format", "metrics", "table"])
  assert.match(record.requirements.css, /slipway.css/)
  assert.ok(record.packages.zod)
  assert.ok(!(await readdir(target)).includes("package.json"))
})

test("a file conflict aborts the whole copy before changing existing content", async t => {
  const root = await sandbox(t)
  const target = join(root, "src")
  await mkdir(join(target, "components/ui"), { recursive: true })
  await writeFile(join(target, "components/ui/table.tsx"), "keep my component")
  await assert.rejects(copyParts(["table"], target), /기존 파일을 보존/)
  assert.equal(await readFile(join(target, "components/ui/table.tsx"), "utf8"), "keep my component")
  assert.deepEqual(await readdir(target), ["components"])
  assert.deepEqual(await readdir(join(target, "components/ui")), ["table.tsx"])
})

test("unknown parts fail before creating a destination", async t => {
  const root = await sandbox(t)
  await assert.rejects(copyParts(["unknown"], join(root, "src")), /없는 부품/)
  assert.deepEqual(await readdir(root), [])
})

test("copying every part includes dependencies but no application entry points", async t => {
  const root = await sandbox(t)
  const result = await copyParts(listParts().map(part => part.id), join(root, "src"))
  assert.ok(result.files.includes("api/client.ts"))
  assert.ok(result.files.includes("lib/kr.ts"))
  assert.ok(result.files.includes("patterns/file-drop.tsx"))
  for (const name of ["advanced-table", "filter-bar", "chart-panel", "step-form", "date-range", "timeline", "csv-transfer"]) {
    assert.ok(result.files.includes(`patterns/${name}.tsx`))
  }
  assert.ok(result.files.includes("lib/csv.ts"))
  assert.ok(!result.files.some(name => /^(routes|features|mocks)\/|routeTree|main\.|config\./.test(name)))
})

test("directory junctions cannot redirect writes outside the destination", async t => {
  const root = await sandbox(t)
  const target = join(root, "src"), outside = join(root, "outside")
  await mkdir(target)
  await mkdir(outside)
  await symlink(outside, join(target, "components"), process.platform === "win32" ? "junction" : "dir")
  await assert.rejects(copyParts(["table"], target), /디렉터리 연결/)
  assert.deepEqual(await readdir(outside), [])
  assert.ok(!(await readdir(target)).includes(".slipway-parts.lock"))
})

test("source templates cannot be used as a copy destination", async () => {
  await assert.rejects(copyParts(["table"], fileURLToPath(new URL("../templates/react/src", import.meta.url))), /원본 src/)
})
