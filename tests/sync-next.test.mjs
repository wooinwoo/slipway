import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import test from "node:test"
import { createProject } from "../scripts/create-project.mjs"

test("Next sync preserves router-specific parts and client directives on native paths", async t => {
  const root = await mkdtemp(join(tmpdir(), "slipway-sync-test-"))
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    assert.ok(basename(root).startsWith("slipway-sync-test-"))
    await rm(root, { recursive: true, force: true })
  })
  await createProject(join(root, "templates/react"), { preset: "react" })
  await createProject(join(root, "templates/next"), { preset: "next" })
  await mkdir(join(root, "scripts"))
  await writeFile(join(root, "scripts/sync-next.mjs"), await readFile(new URL("../scripts/sync-next.mjs", import.meta.url)))
  const parts = ["app-shell", "mobile-shell"]
  const before = await Promise.all(parts.map(name => readFile(join(root, `templates/next/src/shared/patterns/${name}.tsx`), "utf8")))
  execFileSync(process.execPath, [join(root, "scripts/sync-next.mjs")], { cwd: root, stdio: "pipe" })
  for (const [index, name] of parts.entries()) assert.equal(await readFile(join(root, `templates/next/src/shared/patterns/${name}.tsx`), "utf8"), before[index])
  assert.match(await readFile(join(root, "templates/next/src/shared/ui/button.tsx"), "utf8"), /^"use client"\r?\n/)
  assert.match(await readFile(join(root, "templates/next/src/shared/patterns/data-table.tsx"), "utf8"), /^"use client"\r?\n/)
})
